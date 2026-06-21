"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";

// ── Tipos locales (reflejo de shared/types/deudas.ts) ────────────────────────
interface UsuarioResumen {
  id: string;
  nombre: string;
  correo: string;
}

interface GrupoResumen {
  id: string;
  nombre: string;
}

interface DeudaItem {
  id: string;
  monto: number;
  grupo: GrupoResumen;
  contraparte: UsuarioResumen;
  actualizadoEn: string;
}

interface DeudasPendientes {
  debo_a: DeudaItem[];
  me_deben: DeudaItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatearMonto(monto: number) {
  return monto.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Componente tarjeta de deuda ───────────────────────────────────────────────
function TarjetaDeuda({
  deuda,
  tipo,
}: {
  deuda: DeudaItem;
  tipo: "debo_a" | "me_deben";
}) {
  const esDebo = tipo === "debo_a";
  const colorMonto = esDebo ? "#c0392b" : "var(--color-acento)";
  const etiquetaEstilo = esDebo
    ? { background: "#fdecea", color: "#c0392b" }
    : { background: "#edf4f1", color: "var(--color-acento)" };

  return (
    <div className="dashboard-tarjeta">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span className="dashboard-tarjeta__etiqueta" style={etiquetaEstilo}>
          {esDebo ? "Debo a" : "Me debe"}
        </span>
        <span
          style={{ fontSize: "1.125rem", fontWeight: 600, color: colorMonto }}
        >
          {formatearMonto(deuda.monto)}
        </span>
      </div>

      <div className="dashboard-tarjeta__contenido">
        <p className="dashboard-tarjeta__nombre">{deuda.contraparte.nombre}</p>
        <p className="dashboard-tarjeta__descripcion">
          {deuda.contraparte.correo}
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-texto-suave)",
            marginTop: "0.5rem",
            fontWeight: 300,
          }}
        >
          Grupo: {deuda.grupo.nombre}
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-texto-suave)",
            fontWeight: 300,
          }}
        >
          Actualizado: {formatearFecha(deuda.actualizadoEn)}
        </p>
      </div>
    </div>
  );
}

// ── Estado vacío reutilizable ─────────────────────────────────────────────────
function EstadoVacio({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="dashboard-vacio">
      <div className="dashboard-vacio__icono">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <p className="dashboard-vacio__titulo">{titulo}</p>
      <p className="dashboard-vacio__descripcion">{descripcion}</p>
    </div>
  );
}

// ── Contenido interno (usa useSearchParams) ─────────────────────────────────
function ContenidoDeudas() {
  const searchParams = useSearchParams();
  const grupoId = searchParams.get("grupo") || undefined;

  const [deudas, setDeudas] = useState<DeudasPendientes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const url = grupoId ? `/api/deudas?grupo=${grupoId}` : "/api/deudas";
        const res = await peticionAutenticada(url);
        const data = await res.json();
        if (data.exito) {
          setDeudas(data.datos);
        } else {
          setError(data.mensaje || "Error al cargar deudas");
        }
      } catch {
        setError("Error de red al cargar deudas");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [grupoId]);

  const totalMeDeben = deudas?.me_deben.reduce((s, d) => s + d.monto, 0) ?? 0;

  return (
    <div className="dashboard-cuerpo">
      {/* ── Encabezado ── */}
      <header className="dashboard-encabezado">
        <p className="dashboard-encabezado__etiqueta">Finanzas</p>
        <h1 className="dashboard-encabezado__titulo">Deudas pendientes</h1>
        <p className="dashboard-encabezado__descripcion">
          Revisa cuánto debes y cuánto te deben en tus grupos de viaje.
        </p>
        {grupoId && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-texto-suave)",
              marginTop: "0.5rem",
            }}
          >
            Mostrando deudas de un grupo específico.
          </p>
        )}
      </header>

      {/* ── Estados de carga / error ── */}
      {cargando && (
        <div
          style={{
            padding: "2rem 0",
            color: "var(--color-texto-suave)",
            textAlign: "center",
          }}
        >
          Cargando deudas...
        </div>
      )}

      {!cargando && error && (
        <div className="dashboard-vacio">
          <div className="dashboard-vacio__icono">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: "var(--color-texto-secundario)" }}>{error}</p>
        </div>
      )}

      {/* ── Contenido principal ── */}
      {!cargando && !error && deudas && (
        <>
          {/* Resumen numérico */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            <div
              className="dashboard-tarjeta"
              style={{ borderLeft: "3px solid #c0392b" }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-texto-suave)",
                  marginBottom: "0.25rem",
                }}
              >
                Total que debo
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-texto-suave)",
                }}
              >
                {deudas.debo_a.length} deuda
                {deudas.debo_a.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div
              className="dashboard-tarjeta"
              style={{ borderLeft: "3px solid var(--color-acento)" }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-texto-suave)",
                  marginBottom: "0.25rem",
                }}
              >
                Total que me deben
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--color-acento)",
                }}
              >
                {formatearMonto(totalMeDeben)}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-texto-suave)",
                }}
              >
                {deudas.me_deben.length} deuda
                {deudas.me_deben.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Sección: Debo a */}
          <section style={{ marginBottom: "3rem" }}>
            <p
              className="dashboard-seccion__titulo"
              style={{ marginBottom: "1.5rem" }}
            >
              Debo a
            </p>
            {deudas.debo_a.length === 0 ? (
              <EstadoVacio
                titulo="¡Sin deudas!"
                descripcion="No tienes deudas pendientes con nadie."
              />
            ) : (
              <div className="dashboard-grid">
                {deudas.debo_a.map((deuda) => (
                  <TarjetaDeuda key={deuda.id} deuda={deuda} tipo="debo_a" />
                ))}
              </div>
            )}
          </section>

          {/* Sección: Me deben */}
          <section>
            <p
              className="dashboard-seccion__titulo"
              style={{ marginBottom: "1.5rem" }}
            >
              Me deben
            </p>
            {deudas.me_deben.length === 0 ? (
              <EstadoVacio
                titulo="Nadie te debe"
                descripcion="No hay deudas pendientes hacia ti."
              />
            ) : (
              <div className="dashboard-grid">
                {deudas.me_deben.map((deuda) => (
                  <TarjetaDeuda key={deuda.id} deuda={deuda} tipo="me_deben" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ── Página principal con Suspense (requerido por useSearchParams) ─────────
export default function PaginaDeudas() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-cuerpo">
          <div
            style={{
              padding: "4rem 0",
              textAlign: "center",
              color: "var(--color-texto-suave)",
            }}
          >
            Cargando...
          </div>
        </div>
      }
    >
      <ContenidoDeudas />
    </Suspense>
  );
}
