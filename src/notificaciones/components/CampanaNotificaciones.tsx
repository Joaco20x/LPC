"use client";

// CampanaNotificaciones
// Badge con contador, panel desplegable, marcar leída/todas, config por tipo

import { useState, useEffect, useRef } from "react";
import { obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";
import "./notificaciones.css";

type TipoNotificacion =
  | "nuevo_gasto"
  | "pago_deuda"
  | "alerta_deuda"
  | "cierre_viaje"
  | "presupuesto_superado"
  | "integrante_anadido";

interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  metadata: Record<string, unknown>;
  leida: boolean;
  creadoEn: string;
}

const TIPOS_CONFIG: { tipo: TipoNotificacion; etiqueta: string; icono: string }[] = [
  { tipo: "nuevo_gasto", etiqueta: "Nuevo gasto", icono: "💸" },
  { tipo: "pago_deuda", etiqueta: "Pago de deuda", icono: "✅" },
  { tipo: "alerta_deuda", etiqueta: "Alerta de deuda", icono: "⚠️" },
  { tipo: "cierre_viaje", etiqueta: "Cierre de viaje", icono: "✈️" },
  { tipo: "presupuesto_superado", etiqueta: "Presupuesto superado", icono: "🚨" },
  { tipo: "integrante_anadido", etiqueta: "Nuevo integrante", icono: "👤" },
];

const CLAVE_CONFIG = "lpc_notif_config";
const INTERVALO_POLLING = 30_000;

function cargarConfig(): Record<TipoNotificacion, boolean> {
  if (typeof window === "undefined") return {} as Record<TipoNotificacion, boolean>;
  try {
    const raw = localStorage.getItem(CLAVE_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return Object.fromEntries(
    TIPOS_CONFIG.map((t) => [t.tipo, true]),
  ) as Record<TipoNotificacion, boolean>;
}

function guardarConfig(config: Record<TipoNotificacion, boolean>) {
  localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
}

function formatearMensaje(tipo: TipoNotificacion, metadata: Record<string, unknown>): string {
  switch (tipo) {
    case "nuevo_gasto":
      return `${metadata.pagador} pagó ${formatMonto(Number(metadata.monto))} en "${metadata.descripcion}" (${metadata.nombreGrupo})`;
    case "pago_deuda":
      return `${metadata.nombreDeudor} saldó una deuda de ${formatMonto(Number(metadata.monto))} en ${metadata.nombreGrupo}`;
    case "alerta_deuda":
      return `Tienes deudas pendientes en ${metadata.nombreGrupo}`;
    case "cierre_viaje":
      return `El viaje "${metadata.nombreGrupo}" ha sido cerrado`;
    case "presupuesto_superado":
      return `¡Presupuesto superado en ${metadata.nombreGrupo}! Total: ${formatMonto(Number(metadata.totalGastado))}`;
    case "integrante_anadido":
      return `${metadata.nuevoIntegrante} se unió a ${metadata.nombreGrupo}`;
    default:
      return "Nueva notificación";
  }
}

function formatMonto(monto: number) {
  return monto.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatTiempo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export default function CampanaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [config, setConfig] = useState<Record<TipoNotificacion, boolean>>(cargarConfig);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifVisibles = notificaciones.filter((n) => config[n.tipo] !== false);
  const noLeidas = notifVisibles.filter((n) => !n.leida).length;

  // Polling — fetch definido dentro del effect (patrón correcto React)
  useEffect(() => {
    let activo = true;

    async function fetchNotificaciones() {
      const token = obtenerAccessToken();
      if (!token || !activo) return;
      try {
        const res = await fetch("/api/notificaciones", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || !activo) return;
        const data = await res.json();
        if (activo) setNotificaciones(data.datos ?? []);
      } catch {}
    }

    fetchNotificaciones();
    const intervalo = setInterval(fetchNotificaciones, INTERVALO_POLLING);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    function manejarClickFuera(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setMostrarConfig(false);
      }
    }
    if (abierto) document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [abierto]);

  async function marcarUnaLeida(id: string) {
    const token = obtenerAccessToken();
    if (!token) return;
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  async function marcarTodasLeidas() {
    const token = obtenerAccessToken();
    if (!token) return;
    setMarcandoTodas(true);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setMarcandoTodas(false);
  }

  function toggleConfig(tipo: TipoNotificacion) {
    const nueva = { ...config, [tipo]: !config[tipo] };
    setConfig(nueva);
    guardarConfig(nueva);
  }

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button
        className="notif-btn"
        onClick={() => {
          setAbierto((v) => !v);
          setMostrarConfig(false);
        }}
        title="Notificaciones"
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="notif-badge">{noLeidas > 99 ? "99+" : noLeidas}</span>
        )}
      </button>

      {abierto && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-titulo">Notificaciones</span>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                className="notif-btn-leer-todas"
                onClick={marcarTodasLeidas}
                disabled={noLeidas === 0 || marcandoTodas}
              >
                Marcar todas leídas
              </button>
              <button
                className="notif-btn-leer-todas"
                onClick={() => setMostrarConfig((v) => !v)}
                title="Configuración"
              >
                ⚙️
              </button>
            </div>
          </div>

          {!mostrarConfig && (
            <div className="notif-lista">
              {notifVisibles.length === 0 ? (
                <p className="notif-vacio">No tienes notificaciones.</p>
              ) : (
                notifVisibles.map((n) => {
                  const tipoInfo = TIPOS_CONFIG.find((t) => t.tipo === n.tipo);
                  return (
                    <div
                      key={n.id}
                      className={`notif-item${!n.leida ? " notif-item--no-leida" : ""}`}
                      onClick={() => !n.leida && marcarUnaLeida(n.id)}
                    >
                      <div className={`notif-icono notif-icono--${n.tipo}`}>
                        {tipoInfo?.icono ?? "🔔"}
                      </div>
                      <div className="notif-contenido">
                        <p className="notif-mensaje">
                          {formatearMensaje(n.tipo, n.metadata)}
                        </p>
                        <span className="notif-tiempo">{formatTiempo(n.creadoEn)}</span>
                      </div>
                      {!n.leida && <div className="notif-punto" />}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {mostrarConfig && (
            <div className="notif-config">
              <p className="notif-config-titulo">Tipos de notificación</p>
              <div className="notif-config-lista">
                {TIPOS_CONFIG.map(({ tipo, etiqueta, icono }) => (
                  <div key={tipo} className="notif-config-item">
                    <span>
                      {icono} {etiqueta}
                    </span>
                    <label className="notif-toggle">
                      <input
                        type="checkbox"
                        checked={config[tipo] !== false}
                        onChange={() => toggleConfig(tipo)}
                      />
                      <span className="notif-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}