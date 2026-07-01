"use client";

import { useState, useEffect } from "react";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";

interface Resumen {
  id: string;
  mes: number;
  anio: number;
  totalGastos: number;
  datosJson: {
    totalGastos: number;
    porCategoria: Record<string, number>;
    porIntegrante: Record<
      string,
      {
        id: string;
        nombre: string;
        gastado: number;
        asignado: number;
        saldo: number;
      }
    >;
  };
  creadoEn: string;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function HistorialResumenes({ idGrupo }: { idGrupo: string }) {
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;
    const cargarResumenes = async () => {
      try {
        const res = await peticionAutenticada(
          `/api/grupos/${idGrupo}/resumenes`,
        );
        const data = await res.json();
        if (data.exito && montado) {
          setResumenes(data.datos);
        } else if (montado) {
          setError(data.mensaje);
        }
      } catch (err) {
        if (montado) setError("Error al cargar resúmenes");
      } finally {
        if (montado) setCargando(false);
      }
    };

    cargarResumenes();
    return () => {
      montado = false;
    };
  }, [idGrupo]);

  const formatearMonto = (m: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(m);

  if (cargando)
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--color-texto-suave)" }}>
        Cargando historial...
      </p>
    );
  if (error)
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--color-error)" }}>
        {error}
      </p>
    );

  if (resumenes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "1rem",
          color: "var(--color-texto-suave)",
          fontSize: "0.875rem",
        }}
      >
        No hay resúmenes mensuales generados aún.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginTop: "1rem",
      }}
    >
      {resumenes.map((res) => (
        <details
          key={res.id}
          style={{
            background: "var(--color-fondo)",
            border: "1px solid var(--color-borde)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Resumen {MESES[res.mes - 1]} {res.anio}
            </span>
            <span style={{ color: "var(--color-acento)" }}>
              {formatearMonto(Number(res.totalGastos))}
            </span>
          </summary>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Por Categoría */}
            <div>
              <h4
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-texto-suave)",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Gastos por Categoría
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {Object.entries(res.datosJson.porCategoria).map(
                  ([cat, monto]) => (
                    <li
                      key={cat}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>{cat}</span>
                      <strong>{formatearMonto(Number(monto))}</strong>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Por Integrante */}
            <div>
              <h4
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-texto-suave)",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Balance por Integrante
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {Object.values(res.datosJson.porIntegrante).map(
                  (integrante) => (
                    <div
                      key={integrante.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                        alignItems: "center",
                        borderBottom: "1px solid var(--color-borde)",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <span>{integrante.nombre}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ display: "block" }}>
                          Pagó: {formatearMonto(Number(integrante.gastado))}
                        </span>
                        <strong
                          style={{
                            display: "block",
                            color:
                              integrante.saldo > 0
                                ? "var(--color-exito)"
                                : integrante.saldo < 0
                                  ? "var(--color-error)"
                                  : "inherit",
                          }}
                        >
                          {integrante.saldo > 0
                            ? "Le deben "
                            : integrante.saldo < 0
                              ? "Debe "
                              : "Saldo "}
                          {formatearMonto(Math.abs(integrante.saldo))}
                        </strong>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
