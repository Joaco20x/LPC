"use client";
import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import { obtenerDatosUsuario } from "@/shared/servicios/almacenamientoTokens";

interface GrupoResumen {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  totalMiembros: number;
  rol: string;
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaginaPrincipalDashboard() {
  const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [errorGrupos, setErrorGrupos] = useState<string | null>(null);
  const [nombreUsuario] = useState(
    () => obtenerDatosUsuario()?.nombre || "Usuario",
  );

  const cargarGrupos = async () => {
    setCargandoGrupos(true);
    setErrorGrupos(null);
    try {
      const res = await peticionAutenticada("/api/grupos");
      const data = await res.json();
      if (data.exito) {
        setGrupos(data.datos.grupos);
      } else {
        setErrorGrupos(data.mensaje || "Error al cargar grupos");
      }
    } catch {
      setErrorGrupos("Error de red al cargar grupos");
    } finally {
      setCargandoGrupos(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      cargarGrupos();
    });
  }, []);

  return (
    <div className="dashboard-cuerpo">
      <header className="dashboard-encabezado">
        <p className="dashboard-encabezado__etiqueta">Panel principal</p>
        <h1 className="dashboard-encabezado__titulo">
          Bienvenido, <em>{nombreUsuario}.</em>
        </h1>
        <p className="dashboard-encabezado__descripcion">
          Desde aquí puedes gestionar tus viajes actuales o configurar nuevas
          aventuras con tu grupo.
        </p>
      </header>

      {/* ── Acceso rápido a deudas ── */}
      <section style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/deudas"
          className="boton-solido"
          style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 1v22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Ver deudas pendientes
        </Link>
      </section>

      {/* ── Sección Mis Grupos ── */}
      <section style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <p className="dashboard-seccion__titulo" style={{ margin: 0 }}>
            Mis grupos de viaje
          </p>
          <Link
            href="/grupos/crear"
            className="boton-solido"
            style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Crear grupo
          </Link>
        </div>

        {cargandoGrupos ? (
          <div
            style={{
              padding: "2rem 0",
              color: "var(--color-texto-suave)",
              textAlign: "center",
            }}
          >
            Cargando grupos...
          </div>
        ) : errorGrupos ? (
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
            <p style={{ color: "var(--color-texto-secundario)" }}>
              {errorGrupos}
            </p>
          </div>
        ) : grupos.length === 0 ? (
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="dashboard-vacio__titulo">Sin grupos aún</p>
            <p className="dashboard-vacio__descripcion">
              Crea tu primer grupo de viaje y empieza a registrar gastos
              compartidos.
            </p>
            <Link href="/grupos/crear" className="boton-solido">
              Crear mi primer grupo
            </Link>
          </div>
        ) : (
          <div className="dashboard-grid">
            {grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="dashboard-tarjeta"
                style={{ cursor: "default" }}
              >
                {/* Etiqueta de rol */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span className="dashboard-tarjeta__etiqueta">
                    {grupo.rol === "admin" ? "Admin" : "Miembro"}
                  </span>
                  <span
                    className="dashboard-tarjeta__etiqueta"
                    style={{
                      background: "#edf4f1",
                      color: "var(--color-acento)",
                    }}
                  >
                    {grupo.totalMiembros}{" "}
                    {grupo.totalMiembros === 1 ? "persona" : "personas"}
                  </span>
                </div>

                {/* Info del grupo */}
                <div className="dashboard-tarjeta__contenido">
                  <Link
                    href={`/grupos/${grupo.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <p
                      className="dashboard-tarjeta__nombre"
                      style={{
                        color: "var(--color-acento)",
                        cursor: "pointer",
                      }}
                    >
                      {grupo.nombre}
                    </p>
                  </Link>
                  <p className="dashboard-tarjeta__descripcion">
                    {grupo.destino}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-texto-suave)",
                      marginTop: "0.5rem",
                      fontWeight: 300,
                    }}
                  >
                    {formatearFecha(grupo.fechaInicio)} →{" "}
                    {formatearFecha(grupo.fechaFin)}
                  </p>
                </div>

                {/* Botón Agregar Gasto */}
                <Link
                  href={`/gastos?grupo=${grupo.id}`}
                  className="boton-solido"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "0.875rem",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar gasto
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
