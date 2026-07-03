"use client";

// PresupuestoGrupo
// - Si el usuario es Admin del grupo: panel para definir presupuesto máximo
//   por persona + umbral de alerta configurable.
// - Para todos: indicador visual del % de presupuesto usado por integrante,
//   calculado en tiempo real a partir de las divisiones de cada gasto.

import { useState, useMemo, useEffect } from "react";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import { obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";
import "./presupuesto.css";

interface DivisionGastoMin {
  idUsuario: string;
  montoAsignado: number | string;
  moneda?: string | null;
}

interface DeudaMin {
  id: string;
  monto: number;
  moneda?: string | null;
  saldada: boolean;
  deudor: { id: string };
  acreedor: { id: string };
}

interface GastoMin {
  pagador: { id: string };
  monto: number | string;
  moneda?: string | null;
  divisiones: DivisionGastoMin[];
}

interface IntegranteMin {
  id: string;
  nombre: string;
}

interface Props {
  idGrupo: string;
  monedaBase: string;
  presupuestoPorPersona: number | null;
  umbralAlerta: number | null;
  miembros: IntegranteMin[];
  gastos: GastoMin[];
  deudas: DeudaMin[];
  esAdmin: boolean;
  onActualizado?: (datos: {
    presupuestoPorPersona: number | null;
    umbralAlerta: number | null;
  }) => void;
}

function formatMonto(m: number, moneda: string) {
  const locale = moneda === "CLP" ? "es-CL" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
  }).format(m);
}

// ── Subcomponente: indicadores por integrante ──────────────────────────────
// Recibe presupuestoPorPersona/umbralAlerta ya narrowed a `number` (no null)
// para evitar problemas de inferencia de TypeScript dentro de closures (.map).
function IndicadoresIntegrantes({
  miembros,
  acumuladoPorUsuario,
  presupuestoPorPersona,
  umbralAlerta,
  monedaBase,
}: {
  miembros: IntegranteMin[];
  acumuladoPorUsuario: Record<string, number>;
  presupuestoPorPersona: number;
  umbralAlerta: number;
  monedaBase: string;
}) {
  return (
    <div className="presup-integrantes">
      {miembros.map((m) => {
        const acumulado = acumuladoPorUsuario[m.id] ?? 0;
        const porcentajeReal = Math.round(
          (acumulado / presupuestoPorPersona) * 100,
        );
        const porcentajeBarra = Math.min(porcentajeReal, 100);

        let estado: "ok" | "alerta" | "superado" = "ok";
        if (porcentajeReal >= 100) estado = "superado";
        else if (porcentajeReal >= umbralAlerta) estado = "alerta";

        return (
          <div key={m.id} className="presup-integrante-item">
            <div className="presup-integrante-header">
              <span className="presup-integrante-nombre">{m.nombre}</span>
              <span
                className={`presup-porcentaje presup-porcentaje--${estado}`}
              >
                {porcentajeReal}%
              </span>
            </div>
            <div className="presup-barra-fondo">
              <div
                className={`presup-barra-relleno presup-barra-relleno--${estado}`}
                style={{ width: `${porcentajeBarra}%` }}
              />
            </div>
            <span className="presup-integrante-monto">
              {formatMonto(acumulado, monedaBase)} de{" "}
              {formatMonto(presupuestoPorPersona, monedaBase)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PresupuestoGrupo({
  idGrupo,
  monedaBase,
  presupuestoPorPersona,
  umbralAlerta,
  miembros,
  gastos,
  deudas,
  esAdmin,
  onActualizado,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campoPresupuesto, setCampoPresupuesto] = useState(
    presupuestoPorPersona !== null ? String(presupuestoPorPersona) : "",
  );
  const [campoUmbral, setCampoUmbral] = useState(
    umbralAlerta !== null ? String(umbralAlerta) : "80",
  );

  // ── Tasas de cambio para monedas distintas a la base ──
  const [tasas, setTasas] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const monedasUnicas = [
      ...new Set(
        [...gastos.map((g) => g.moneda), ...deudas.map((d) => d.moneda)].filter(
          (m): m is string => Boolean(m) && m !== monedaBase,
        ),
      ),
    ];
    if (monedasUnicas.length === 0) return;

    const token = obtenerAccessToken();
    let cancelado = false;

    async function cargarTasas() {
      const entradas = await Promise.all(
        monedasUnicas.map(async (from) => {
          try {
            const res = await fetch(
              `/api/tasas-cambio?from=${from}&to=${monedaBase}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) return [from, 1] as const;
            const data = await res.json();
            return [from, data.datos?.tasa ?? 1] as const;
          } catch {
            return [from, 1] as const;
          }
        }),
      );
      if (!cancelado) setTasas(new Map(entradas));
    }

    cargarTasas();
    return () => {
      cancelado = true;
    };
  }, [gastos, deudas, monedaBase]);

  // ── Gasto acumulado por integrante ──
  const acumuladoPorUsuario = useMemo(() => {
    const mapa: Record<string, number> = {};

    // Sumar montos de divisiones por usuario (convertido a moneda base)
    for (const gasto of gastos) {
      for (const div of gasto.divisiones) {
        const montoAsignado = Number(div.montoAsignado);
        const moneda = div.moneda || gasto.moneda;
        const convertido =
          moneda && moneda !== monedaBase
            ? montoAsignado * (tasas.get(moneda) ?? 1)
            : montoAsignado;
        mapa[div.idUsuario] = (mapa[div.idUsuario] ?? 0) + convertido;
      }
    }

    // Ajuste por deudas saldadas (convertido a moneda base)
    for (const deuda of deudas) {
      if (!deuda.saldada) continue;
      const monto = Number(deuda.monto);
      const moneda = deuda.moneda;
      const convertido =
        moneda && moneda !== monedaBase
          ? monto * (tasas.get(moneda) ?? 1)
          : monto;
      mapa[deuda.acreedor.id] = (mapa[deuda.acreedor.id] ?? 0) - convertido;
      mapa[deuda.deudor.id] = (mapa[deuda.deudor.id] ?? 0) + convertido;
    }

    return mapa;
  }, [gastos, deudas, monedaBase, tasas]);

  async function guardar() {
    setError(null);

    const presupuestoNum =
      campoPresupuesto.trim() === "" ? null : Number(campoPresupuesto);
    const umbralNum = campoUmbral.trim() === "" ? null : Number(campoUmbral);

    if (
      presupuestoNum !== null &&
      (isNaN(presupuestoNum) || presupuestoNum <= 0)
    ) {
      setError("El presupuesto debe ser un número positivo");
      return;
    }
    if (
      umbralNum !== null &&
      (isNaN(umbralNum) || umbralNum < 1 || umbralNum > 100)
    ) {
      setError("El umbral debe estar entre 1 y 100");
      return;
    }

    setGuardando(true);
    try {
      const res = await peticionAutenticada(
        `/api/grupos/${idGrupo}/presupuesto`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presupuestoPorPersona: presupuestoNum,
            umbralAlerta: umbralNum,
          }),
        },
      );
      const data = await res.json();
      if (!data.exito) {
        setError(data.mensaje || "No se pudo guardar el presupuesto");
        return;
      }
      onActualizado?.({
        presupuestoPorPersona: presupuestoNum,
        umbralAlerta: umbralNum,
      });
      setEditando(false);
    } catch {
      setError("Error de conexión al guardar");
    } finally {
      setGuardando(false);
    }
  }

  const mostrarIndicadores =
    presupuestoPorPersona !== null && presupuestoPorPersona > 0;

  return (
    <div className="presup-panel">
      {/* ── Panel de configuración (solo Admin) ── */}
      {esAdmin && (
        <>
          <div className="presup-panel-header">
            <span className="presup-panel-titulo">
              💰 Presupuesto por persona
            </span>
            {!editando && (
              <button
                className="presup-btn-editar"
                onClick={() => setEditando(true)}
              >
                {presupuestoPorPersona !== null ? "Editar" : "Configurar"}
              </button>
            )}
          </div>

          {editando ? (
            <div className="presup-form">
              <div className="presup-campo">
                <label htmlFor="presup-monto">
                  Presupuesto máximo por persona ({monedaBase})
                </label>
                <input
                  id="presup-monto"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 300000"
                  value={campoPresupuesto}
                  onChange={(e) => setCampoPresupuesto(e.target.value)}
                />
              </div>
              <div className="presup-campo">
                <label htmlFor="presup-umbral">
                  Umbral de alerta (% del presupuesto)
                </label>
                <input
                  id="presup-umbral"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ej: 80"
                  value={campoUmbral}
                  onChange={(e) => setCampoUmbral(e.target.value)}
                />
              </div>

              {error && <p className="presup-error">{error}</p>}

              <div className="presup-acciones">
                <button
                  className="boton-solido"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                  onClick={guardar}
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button
                  className="presup-btn-editar"
                  onClick={() => {
                    setEditando(false);
                    setError(null);
                    setCampoPresupuesto(
                      presupuestoPorPersona !== null
                        ? String(presupuestoPorPersona)
                        : "",
                    );
                    setCampoUmbral(
                      umbralAlerta !== null ? String(umbralAlerta) : "80",
                    );
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : presupuestoPorPersona !== null ? (
            <div className="presup-resumen">
              <span>
                Máximo por persona:{" "}
                <strong>
                  {formatMonto(presupuestoPorPersona, monedaBase)}
                </strong>
              </span>
              <span>
                Alerta al <strong>{umbralAlerta ?? 100}%</strong> del
                presupuesto
              </span>
            </div>
          ) : (
            <div className="presup-resumen">
              <span className="presup-resumen-vacio">
                Aún no has definido un presupuesto por persona para este viaje.
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Indicador visual por integrante ── */}
      {mostrarIndicadores && (
        <IndicadoresIntegrantes
          miembros={miembros}
          acumuladoPorUsuario={acumuladoPorUsuario}
          presupuestoPorPersona={presupuestoPorPersona as number}
          umbralAlerta={umbralAlerta ?? 100}
          monedaBase={monedaBase}
        />
      )}
    </div>
  );
}
