"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import { obtenerDatosUsuario } from "@/shared/servicios/almacenamientoTokens";
import type { VotacionConDetalle } from "@/votaciones/types/votacion";
import "./votaciones.css";

export default function PaginaVotaciones() {
  const { id: idGrupo } = useParams<{ id: string }>();
  const [votaciones, setVotaciones] = useState<VotacionConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votando, setVotando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Form nueva votación
  const [mostrarForm, setMostrarForm] = useState(false);
  const [idDeuda, setIdDeuda] = useState("");
  const [tipo, setTipo] = useState<"abstencion" | "denuncia">("abstencion");
  const [creando, setCreando] = useState(false);

  const usuario = obtenerDatosUsuario();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await peticionAutenticada(
        `/api/votaciones?idGrupo=${idGrupo}`,
      );
      const data = await res.json();
      if (data.exito) setVotaciones(data.datos.votaciones);
      else setError(data.mensaje);
    } catch {
      setError("Error al cargar votaciones");
    } finally {
      setCargando(false);
    }
  }, [idGrupo]);

  // Carga inicial y polling cada 5s para tiempo real
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos al montar, patrón estándar de fetch
    cargar();
    const intervalo = setInterval(cargar, 5000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const votar = async (
    idVotacion: string,
    decision: "aprobar" | "rechazar",
  ) => {
    setVotando(idVotacion);
    setMensaje(null);
    try {
      const res = await peticionAutenticada(
        `/api/votaciones/${idVotacion}/votar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const data = await res.json();
      if (data.exito) {
        setMensaje({ tipo: "ok", texto: data.mensaje });
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: data.mensaje });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al emitir voto" });
    } finally {
      setVotando(null);
    }
  };

  const crearVotacion = async () => {
    if (!idDeuda.trim()) return;
    setCreando(true);
    setMensaje(null);
    try {
      const res = await peticionAutenticada("/api/votaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idGrupo, idDeuda: idDeuda.trim(), tipo }),
      });
      const data = await res.json();
      if (data.exito) {
        setMensaje({
          tipo: "ok",
          texto: "Votación iniciada. Se notificó a todos los integrantes.",
        });
        setMostrarForm(false);
        setIdDeuda("");
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: data.mensaje });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al crear votación" });
    } finally {
      setCreando(false);
    }
  };

  const porcentaje = (n: number, total: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100);

  const etiquetaTipo: Record<string, string> = {
    abstencion: "🤚 Abstención de pago",
    denuncia: "⚠️ Denuncia por deuda no pagada",
  };

  const etiquetaEstado: Record<string, { label: string; color: string }> = {
    activa: { label: "En votación", color: "#2d4a3e" },
    resuelta: { label: "Resuelta", color: "#6b6b67" },
  };

  const etiquetaResultado: Record<string, { label: string; color: string }> = {
    aprobada: { label: "✔ Aprobada", color: "#2d4a3e" },
    rechazada: { label: "✖ Rechazada", color: "#c0392b" },
  };

  return (
    <div className="dashboard-cuerpo votaciones-raiz">
      <nav className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href={`/grupos/${idGrupo}`}>Grupo</Link>
        <span>/</span>
        <span>Votaciones</span>
      </nav>

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
        <div>
          <h1 className="dashboard-encabezado__titulo">Votaciones del grupo</h1>
          <p className="dashboard-encabezado__descripcion">
            Abstenciones y denuncias por deudas
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="votac-btn-crear"
        >
          + Nueva votación
        </button>
      </div>

      {/* Mensaje global */}
      {mensaje && (
        <div className={`votac-mensaje votac-mensaje--${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario nueva votación */}
      {mostrarForm && (
        <div className="votac-form">
          <h3 className="votac-form__titulo">Iniciar nueva votación</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div>
              <label className="votac-label">Tipo de votación</label>
              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}
              >
                {(["abstencion", "denuncia"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`votac-tipo-btn${tipo === t ? " votac-tipo-btn--activo" : ""}`}
                  >
                    {t === "abstencion" ? "🤚 Abstención" : "⚠️ Denuncia"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="votac-label">ID de la deuda</label>
              <input
                type="text"
                value={idDeuda}
                onChange={(e) => setIdDeuda(e.target.value)}
                placeholder="UUID de la deuda"
                className="votac-input"
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-texto-suave)",
                  marginTop: "0.25rem",
                }}
              >
                Puedes obtener el ID desde la sección de Deudas del grupo.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={crearVotacion}
                disabled={creando || !idDeuda.trim()}
                className="votac-btn-crear"
                style={{ flex: 1 }}
              >
                {creando ? "Iniciando…" : "Iniciar votación"}
              </button>
              <button
                onClick={() => setMostrarForm(false)}
                className="votac-btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de votaciones */}
      {cargando ? (
        <p style={{ color: "var(--color-texto-suave)" }}>
          Cargando votaciones…
        </p>
      ) : error ? (
        <p style={{ color: "#c0392b" }}>{error}</p>
      ) : votaciones.length === 0 ? (
        <div className="votac-vacio">
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗳️</p>
          <p>No hay votaciones en este grupo todavía.</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Inicia una para proponer una abstención o denunciar una deuda.
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {votaciones.map((v) => {
            const yaVote = v.votos.some((vt) => vt.idUsuario === usuario?.id);
            const miVoto = v.votos.find((vt) => vt.idUsuario === usuario?.id);
            const estadoInfo = etiquetaEstado[v.estado];
            const pctAprobar = porcentaje(v.aprobaciones, v.totalMiembros);
            const pctRechazar = porcentaje(v.rechazos, v.totalMiembros);

            return (
              <div key={v.id} className="votac-card">
                {/* Cabecera */}
                <div className="votac-card__cabecera">
                  <div style={{ flex: 1 }}>
                    <span className="votac-badge-tipo">
                      {etiquetaTipo[v.tipo]}
                    </span>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-texto-suave)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Iniciada{" "}
                      {new Date(v.creadoEn).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        background:
                          v.estado === "activa" ? "#edf4f1" : "#f0f0f0",
                        color: estadoInfo.color,
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {estadoInfo.label}
                    </span>
                    {v.resultado && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: etiquetaResultado[v.resultado].color,
                          marginTop: "0.25rem",
                        }}
                      >
                        {etiquetaResultado[v.resultado].label}
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ margin: "1rem 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.8125rem",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <span style={{ color: "#2d4a3e", fontWeight: 500 }}>
                      ✔ Aprobar ({v.aprobaciones})
                    </span>
                    <span style={{ color: "#6b6b67" }}>
                      {v.pendientes} pendientes
                    </span>
                    <span style={{ color: "#c0392b", fontWeight: 500 }}>
                      ✖ Rechazar ({v.rechazos})
                    </span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      background: "#f0f0ee",
                      borderRadius: "999px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: `${pctAprobar}%`,
                        background: "#2d4a3e",
                        transition: "width 0.4s",
                      }}
                    />
                    <div
                      style={{
                        width: `${pctRechazar}%`,
                        background: "#c0392b",
                        transition: "width 0.4s",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-texto-suave)",
                      marginTop: "0.4rem",
                    }}
                  >
                    {v.totalMiembros} integrante
                    {v.totalMiembros !== 1 ? "s" : ""} en el grupo
                  </p>
                </div>

                {/* Avatares de votantes */}
                {v.votos.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "1rem",
                    }}
                  >
                    {v.votos.map((vt) => (
                      <div
                        key={vt.idUsuario}
                        title={`${vt.nombreUsuario}: ${vt.decision}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          background:
                            vt.decision === "aprobar" ? "#edf4f1" : "#fef0f0",
                          border: `1px solid ${vt.decision === "aprobar" ? "#b8d4c8" : "#f5c6c6"}`,
                          borderRadius: "999px",
                          padding: "0.2rem 0.6rem",
                          fontSize: "0.75rem",
                          color:
                            vt.decision === "aprobar" ? "#2d4a3e" : "#c0392b",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background:
                              vt.decision === "aprobar" ? "#2d4a3e" : "#c0392b",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.625rem",
                            fontWeight: 600,
                          }}
                        >
                          {vt.nombreUsuario.charAt(0).toUpperCase()}
                        </div>
                        {vt.nombreUsuario.split(" ")[0]}
                        <span>{vt.decision === "aprobar" ? "✔" : "✖"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botones de voto */}
                {v.estado === "activa" && !yaVote && (
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => votar(v.id, "aprobar")}
                      disabled={votando === v.id}
                      className="votac-btn-aprobar"
                    >
                      {votando === v.id ? "…" : "✔ Aprobar"}
                    </button>
                    <button
                      onClick={() => votar(v.id, "rechazar")}
                      disabled={votando === v.id}
                      className="votac-btn-rechazar"
                    >
                      {votando === v.id ? "…" : "✖ Rechazar"}
                    </button>
                  </div>
                )}

                {v.estado === "activa" && yaVote && (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-texto-suave)",
                      fontStyle: "italic",
                    }}
                  >
                    Ya votaste:{" "}
                    <strong>
                      {miVoto?.decision === "aprobar"
                        ? "✔ Aprobar"
                        : "✖ Rechazar"}
                    </strong>
                    . Esperando al resto.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
