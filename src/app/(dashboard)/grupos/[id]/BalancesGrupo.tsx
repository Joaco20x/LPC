"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import "./detalles.css";

interface UsuarioBalance {
  id: string;
  nombre: string;
  balance: number;
}

interface TransferenciaSugerida {
  deudor: { id: string; nombre: string };
  acreedor: { id: string; nombre: string };
  monto: number;
}

interface DatosDeudas {
  balances: UsuarioBalance[];
  transferenciasSugeridas: TransferenciaSugerida[];
  estadisticas: {
    transferenciasSinOptimizar: number;
    transferenciasOptimizadas: number;
  };
}

export default function BalancesGrupo({ idGrupo }: { idGrupo: string }) {
  const [datos, setDatos] = useState<DatosDeudas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargarDeudas = useCallback(() => {
    startTransition(async () => {
      setCargando(true);
      try {
        const res = await peticionAutenticada(`/api/grupos/${idGrupo}/deudas`);
        const payload = await res.json();
        if (payload.exito) {
          setDatos(payload.datos);
        } else {
          setError(payload.mensaje || "Error al cargar deudas");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setCargando(false);
      }
    });
  }, [idGrupo]);

  useEffect(() => {
    cargarDeudas();

    // Escuchar el evento cuando se crea un gasto normal para recalcular saldos
    const handleRecarga = () => cargarDeudas();
    window.addEventListener("gastoRegistrado", handleRecarga);
    return () => window.removeEventListener("gastoRegistrado", handleRecarga);
  }, [cargarDeudas]);

  const saldarTransferencia = async (t: TransferenciaSugerida) => {
    setProcesando(`${t.deudor.id}-${t.acreedor.id}`);
    try {
      const res = await peticionAutenticada(`/api/grupos/${idGrupo}/deudas`, {
        method: "POST",
        body: JSON.stringify({
          idDeudor: t.deudor.id,
          idAcreedor: t.acreedor.id,
          monto: t.monto,
        }),
      });

      const data = await res.json();
      if (data.exito) {
        await cargarDeudas();
        window.dispatchEvent(new Event("gastoRegistrado"));
      } else {
        alert("Error: " + data.mensaje);
      }
    } catch {
      alert("Error de red al saldar la deuda");
    } finally {
      setProcesando(null);
    }
  };

  const formatearMonto = (m: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(m);

  if (cargando && !datos)
    return <p className="texto-suave">Calculando balances...</p>;
  if (error || !datos)
    return (
      <p className="auth-mensaje--error">
        {error || "No se pudieron calcular las deudas"}
      </p>
    );

  return (
    <div className="balances-contenedor">
      <div className="seccion-detalles" style={{ marginTop: "2rem" }}>
        <h2 className="titulo-seccion">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Balances y Transferencias
        </h2>

        {/* Resumen de balances individuales */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          {datos.balances.map((b) => (
            <div
              key={b.id}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--color-borde)",
                background:
                  b.balance > 0
                    ? "rgba(40, 167, 69, 0.05)"
                    : b.balance < 0
                      ? "rgba(220, 53, 69, 0.05)"
                      : "var(--fondo-superficie)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>
                {b.nombre}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color:
                    b.balance > 0
                      ? "var(--color-exito, #28a745)"
                      : b.balance < 0
                        ? "var(--color-error, #dc3545)"
                        : "var(--color-texto-suave)",
                }}
              >
                {b.balance > 0 ? "+" : ""}
                {formatearMonto(b.balance)}
              </p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          Transferencias Sugeridas
        </h3>

        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-texto-suave)",
            marginBottom: "1rem",
          }}
        >
          Optimizadas: Se requieren{" "}
          <strong>{datos.estadisticas.transferenciasOptimizadas}</strong>{" "}
          transferencias (vs {datos.estadisticas.transferenciasSinOptimizar} sin
          optimización).
        </p>

        {datos.transferenciasSugeridas.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              border: "1px dashed var(--color-borde)",
              borderRadius: "8px",
              color: "var(--color-texto-suave)",
            }}
          >
            ¡Todo saldado! No hay deudas pendientes en el grupo.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {datos.transferenciasSugeridas.map((t, index) => {
              const procesandoActual =
                procesando === `${t.deudor.id}-${t.acreedor.id}`;
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    border: "1px solid var(--color-borde)",
                    borderRadius: "8px",
                    background: "var(--fondo-superficie)",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{t.deudor.nombre}</span>{" "}
                    debe pagarle a{" "}
                    <span style={{ fontWeight: 600 }}>{t.acreedor.nombre}</span>
                    <br />
                    <span
                      style={{
                        color: "var(--color-error, #dc3545)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      {formatearMonto(t.monto)}
                    </span>
                  </div>
                  <button
                    className="boton-solido"
                    onClick={() => saldarTransferencia(t)}
                    disabled={procesandoActual}
                    style={{
                      background: "var(--color-exito, #28a745)",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {procesandoActual ? "Saldando..." : "Marcar como pagada"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
