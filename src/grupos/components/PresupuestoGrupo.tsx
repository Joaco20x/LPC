"use client";

// PresupuestoGrupo
// - Si el usuario es Admin del grupo: panel para definir presupuesto máximo
//   por persona + umbral de alerta configurable.
// - Para todos: indicador visual del % de presupuesto usado por integrante,
//   calculado en tiempo real a partir de las divisiones de cada gasto.

import { useState, useMemo } from "react";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import "./presupuesto.css";

interface DivisionGastoMin {
  idUsuario: string;
  montoAsignado: number | string;
}

interface GastoMin {
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

  // ── Gasto acumulado por integrante (calculado en tiempo real) ──
  const acumuladoPorUsuario = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const gasto of gastos) {
      for (const div of gasto.divisiones) {
        mapa[div.idUsuario] =
          (mapa[div.idUsuario] ?? 0) + Number(div.montoAsignado);
      }
    }
    return mapa;
  }, [gastos]);

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
