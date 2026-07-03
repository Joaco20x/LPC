"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  obtenerDatosUsuario,
  obtenerAccessToken,
} from "@/shared/servicios/almacenamientoTokens";

interface InfoInvitacion {
  token: string;
  estado: "pendiente" | "aceptada" | "expirada";
  correoInvitado: string | null;
  expiraEn: string;
  tipo: string;
}

interface InfoGrupo {
  nombreGrupo: string;
  destino: string;
}

export default function PaginaAceptarInvitacion() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<(InfoInvitacion & InfoGrupo) | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aceptando, setAceptando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const usuarioActual = obtenerDatosUsuario();
  const estaLogueado = !!usuarioActual && !!obtenerAccessToken();

  const cargarInvitacion = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/invitaciones/${token}`);
      const data = await res.json();
      if (data.exito) {
        setInfo({
          ...data.datos.invitacion,
          nombreGrupo: data.datos.nombreGrupo,
          destino: data.datos.destino,
        });
      } else {
        setError(data.mensaje || "Invitación no válida");
      }
    } catch {
      setError("Error al cargar la invitación");
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial al montar
    if (token) cargarInvitacion();
  }, [token, cargarInvitacion]);

  const aceptarInvitacion = async () => {
    if (!estaLogueado) return;
    setAceptando(true);
    try {
      const accessToken = obtenerAccessToken();
      const res = await fetch(`/api/invitaciones/${token}/aceptar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.exito) {
        setExito(true);
        setTimeout(() => router.push(`/grupos/${data.datos.idGrupo}`), 2000);
      } else {
        setError(data.mensaje || "No se pudo aceptar la invitación");
      }
    } catch {
      setError("Error al aceptar la invitación");
    } finally {
      setAceptando(false);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const etiquetaEstado: Record<string, string> = {
    pendiente: "✅ Vigente",
    aceptada: "✔ Ya utilizada",
    expirada: "⏰ Expirada",
  };

  const colorEstado: Record<string, string> = {
    pendiente: "#2d4a3e",
    aceptada: "#6b6b67",
    expirada: "#c0392b",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f7f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e4e0",
          borderRadius: "1.25rem",
          padding: "3rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Marca */}
        <p
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#2d4a3e",
            marginBottom: "2rem",
          }}
        >
          Eatryp — Invitación
        </p>

        {cargando ? (
          <p style={{ color: "#6b6b67", textAlign: "center" }}>
            Cargando invitación…
          </p>
        ) : error ? (
          <div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "1.75rem",
                marginBottom: "1rem",
                color: "#1a1a18",
              }}
            >
              Invitación inválida
            </h1>
            <p style={{ color: "#c0392b", marginBottom: "2rem" }}>{error}</p>
            <Link
              href="/dashboard"
              style={{ color: "#2d4a3e", fontWeight: 500 }}
            >
              Ir al dashboard →
            </Link>
          </div>
        ) : exito ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "1.75rem",
                color: "#2d4a3e",
                marginBottom: "0.5rem",
              }}
            >
              ¡Bienvenido al grupo!
            </h1>
            <p style={{ color: "#6b6b67" }}>Redirigiendo al grupo…</p>
          </div>
        ) : info ? (
          <>
            {/* Encabezado del grupo */}
            <h1
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: "2rem",
                color: "#1a1a18",
                marginBottom: "0.25rem",
              }}
            >
              {info.nombreGrupo}
            </h1>
            <p style={{ color: "#6b6b67", marginBottom: "2rem" }}>
              📍 {info.destino}
            </p>

            {/* Estado */}
            <div
              style={{
                background: "#f8f7f4",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "#a0a09c" }}>Estado</span>
                <strong style={{ color: colorEstado[info.estado] }}>
                  {etiquetaEstado[info.estado]}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "#a0a09c" }}>Expira</span>
                <span style={{ color: "#1a1a18" }}>
                  {formatearFecha(info.expiraEn)}
                </span>
              </div>
              {info.correoInvitado && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: "#a0a09c" }}>Para</span>
                  <span style={{ color: "#1a1a18" }}>
                    {info.correoInvitado}
                  </span>
                </div>
              )}
            </div>

            {/* Acción según estado y sesión */}
            {info.estado === "pendiente" ? (
              estaLogueado ? (
                <div>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "#6b6b67",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Hola, <strong>{usuarioActual?.nombre}</strong>. Haz clic
                    para unirte al grupo.
                  </p>
                  <button
                    onClick={aceptarInvitacion}
                    disabled={aceptando}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      background: aceptando ? "#a0a09c" : "#2d4a3e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      fontWeight: 500,
                      cursor: aceptando ? "not-allowed" : "pointer",
                    }}
                  >
                    {aceptando ? "Uniéndote…" : "Unirme al grupo"}
                  </button>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "#6b6b67",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Para unirte a este grupo necesitas iniciar sesión o crear
                    una cuenta.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <Link
                      href={`/login?redirect=/invitar/${token}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "0.875rem",
                        background: "#2d4a3e",
                        color: "#fff",
                        borderRadius: "0.5rem",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href={`/registro?redirect=/invitar/${token}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "0.875rem",
                        border: "1px solid #2d4a3e",
                        color: "#2d4a3e",
                        borderRadius: "0.5rem",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Crear cuenta nueva
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#6b6b67", marginBottom: "1.5rem" }}>
                  {info.estado === "aceptada"
                    ? "Esta invitación ya fue utilizada."
                    : "Esta invitación ha expirado."}
                </p>
                <Link
                  href="/dashboard"
                  style={{ color: "#2d4a3e", fontWeight: 500 }}
                >
                  Ir al dashboard →
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
