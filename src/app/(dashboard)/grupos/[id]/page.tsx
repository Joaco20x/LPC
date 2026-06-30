"use client";

import { useState, useEffect, startTransition, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import { MONEDA_DEFAULT } from "@/gastos/types/gasto";
import "./detalles.css";
import BalancesGrupo from "./BalancesGrupo";
import CalendarioGastos from "@/gastos/components/CalendarioGastos";
import "@/gastos/components/calendario.css";

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  moneda: string;
  categoria: string;
  creadoEn: string;
  pagador: { nombre: string };
}

interface Integrante {
  rol: string;
  usuario: {
    id: string;
    nombre: string;
    correo: string;
  };
}

interface GrupoDetalle {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  monedaBase: string;
  miembros: Integrante[];
  gastos: Gasto[];
  totalEnBase: number;
}

type Vista = "lista" | "calendario";

export default function PaginaDetalleGrupo() {
  const { id } = useParams();
  const [grupo, setGrupo] = useState<GrupoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("lista");

  const cargarDetalle = useCallback(() => {
    if (!id) return;
    startTransition(async () => {
      setCargando(true);
      try {
        const res = await peticionAutenticada(`/api/grupos/${id}`);
        const data = await res.json();
        if (data.exito) {
          setGrupo(data.datos.grupo);
        } else {
          setError(data.mensaje || "Error al cargar el grupo");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setCargando(false);
      }
    });
  }, [id]);

  useEffect(() => {
    cargarDetalle();
    const handleGastoRegistrado = () => cargarDetalle();
    window.addEventListener("gastoRegistrado", handleGastoRegistrado);
    return () =>
      window.removeEventListener("gastoRegistrado", handleGastoRegistrado);
  }, [cargarDetalle]);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatearMonto = (m: number, moneda?: string) => {
    const mon = moneda || MONEDA_DEFAULT;
    const locale = mon === "CLP" ? "es-CL" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: mon,
    }).format(m);
  };

  if (cargando)
    return (
      <div className="dashboard-cuerpo">
        <p>Cargando detalles...</p>
      </div>
    );
  if (error || !grupo)
    return (
      <div className="dashboard-cuerpo">
        <p className="auth-mensaje--error">
          {error || "No se encontró el grupo"}
        </p>
      </div>
    );

  const totalGastado = grupo.totalEnBase;

  return (
    <div className="dashboard-cuerpo detalles-grupo-raiz">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <span style={{ color: "var(--color-texto-principal)" }}>
          {grupo.nombre}
        </span>
      </nav>

      {/* Cabecera */}
      <header className="cabecera-grupo">
        <h1 className="dashboard-encabezado__titulo">{grupo.nombre}</h1>
        <p className="dashboard-encabezado__descripcion">
          {grupo.destino} • {formatearFecha(grupo.fechaInicio)} al{" "}
          {formatearFecha(grupo.fechaFin)}
        </p>
      </header>

      <div className="grid-detalles">
        {/* Columna Principal */}
        <main>
          <div className="seccion-detalles">
            {/* Cabecera con selector de vista */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <h2 className="titulo-seccion" style={{ margin: 0 }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  {vista === "lista"
                    ? "Historial de Gastos"
                    : "Calendario de Gastos"}
                </h2>

                {/* Selector lista / calendario */}
                <div className="cal-selector-vista">
                  <button
                    className={`cal-vista-btn${vista === "lista" ? " cal-vista-btn--activo" : ""}`}
                    onClick={() => setVista("lista")}
                    title="Vista lista"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Lista
                  </button>
                  <button
                    className={`cal-vista-btn${vista === "calendario" ? " cal-vista-btn--activo" : ""}`}
                    onClick={() => setVista("calendario")}
                    title="Vista calendario"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Calendario
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Link
                  href={`/gastos?grupo=${grupo.id}`}
                  className="boton-solido"
                  style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
                >
                  + Nuevo Gasto
                </Link>
                <Link
                  href={`/deudas?grupo=${grupo.id}`}
                  className="boton-solido"
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.6rem 1.25rem",
                    background: "transparent",
                    color: "var(--color-acento)",
                    border: "1px solid var(--color-acento)",
                  }}
                >
                  Ver deudas
                </Link>
              </div>
            </div>

            {/* Vista lista */}
            {vista === "lista" &&
              (grupo.gastos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "var(--color-texto-suave)",
                  }}
                >
                  <p>Aún no hay gastos registrados en este viaje.</p>
                </div>
              ) : (
                <div className="lista-gastos">
                  {grupo.gastos.map((gasto) => (
                    <div key={gasto.id} className="gasto-item">
                      <div className="gasto-info-principal">
                        <span className="gasto-descripcion">
                          {gasto.descripcion}
                        </span>
                        <span className="gasto-meta">
                          Pagado por <strong>{gasto.pagador.nombre}</strong> •{" "}
                          {new Date(gasto.creadoEn).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="gasto-monto">
                          {formatearMonto(Number(gasto.monto), gasto.moneda)}
                        </span>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-texto-suave)",
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                          }}
                        >
                          <span>{gasto.categoria}</span>
                          {gasto.moneda &&
                            gasto.moneda !== grupo.monedaBase && (
                              <span
                                className="gasto-moneda-indicador"
                                title={`Registrado en ${gasto.moneda}`}
                              >
                                {gasto.moneda}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total al pie del historial */}
                  <div
                    className="gasto-item"
                    style={{
                      borderTop: "2px solid var(--color-borde)",
                      marginTop: "0.5rem",
                      paddingTop: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    <div className="gasto-info-principal">
                      <span className="gasto-descripcion">Total del viaje</span>
                      <span className="gasto-meta">
                        {grupo.gastos.length} gasto
                        {grupo.gastos.length !== 1 ? "s" : ""} registrado
                        {grupo.gastos.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        className="gasto-monto"
                        style={{
                          color: "var(--color-acento)",
                          fontSize: "1.2rem",
                        }}
                      >
                        {formatearMonto(totalGastado, grupo.monedaBase)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {/* Vista calendario */}
            {vista === "calendario" && (
              <CalendarioGastos
                idGrupo={grupo.id}
                totalGastado={totalGastado}
                monedaBase={grupo.monedaBase}
              />
            )}
          </div>

          <BalancesGrupo idGrupo={grupo.id} />
        </main>

        {/* Columna Lateral */}
        <aside>
          <div
            className="seccion-detalles"
            style={{ background: "var(--color-acento)", color: "white" }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
                opacity: 0.8,
              }}
            >
              Total Gastado ({grupo.monedaBase})
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "600",
                fontFamily: "var(--fuente-display)",
              }}
            >
              {formatearMonto(totalGastado, grupo.monedaBase)}
            </p>
          </div>

          <div className="seccion-detalles">
            <h2 className="titulo-seccion" style={{ fontSize: "1.25rem" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Integrantes ({grupo.miembros.length})
            </h2>
            <div className="lista-miembros">
              {grupo.miembros.map((miembro) => (
                <div key={miembro.usuario.id} className="integrante-fila">
                  <div className="avatar-mini">
                    {miembro.usuario.nombre.charAt(0)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>
                      {miembro.usuario.nombre}{" "}
                      {miembro.rol === "admin" && "(Admin)"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-texto-suave)",
                      }}
                    >
                      {miembro.usuario.correo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
