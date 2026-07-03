"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import type { ResumenViaje } from "@/resumen/types/resumenViaje";
import "./resumen-viaje.css";

const COLORES_CATEGORIA: Record<string, string> = {
  Comida: "#e74c3c",
  Transporte: "#3498db",
  Alojamiento: "#2ecc71",
  Entretenimiento: "#f39c12",
  Otros: "#95a5a6",
};

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

function formatearMonto(m: number, moneda = "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: moneda,
  }).format(m);
}

function formatearFecha(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PaginaResumenViaje() {
  const { id } = useParams();
  const [data, setData] = useState<ResumenViaje | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;
    const cargar = async () => {
      try {
        const res = await peticionAutenticada(
          `/api/grupos/${id}/resumen-viaje`,
        );
        const body = await res.json();
        if (body.exito && montado) {
          setData(body.datos);
        } else if (montado) {
          setError(body.mensaje || "Error al cargar resumen");
        }
      } catch {
        if (montado) setError("Error de conexión");
      } finally {
        if (montado) setCargando(false);
      }
    };
    if (id) cargar();
    return () => {
      montado = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <div
        className="resumen-viaje"
        style={{ textAlign: "center", paddingTop: "4rem" }}
      >
        Cargando resumen del viaje...
      </div>
    );
  }

  if (error) {
    return (
      <div className="resumen-viaje resumen-error">
        <p>{error}</p>
        <Link href={`/grupos/${id}`} style={{ color: "var(--color-acento)" }}>
          Volver al grupo
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const {
    grupo,
    resumenGeneral,
    porCategoria,
    porIntegrante,
    ranking,
    deudas,
  } = data;

  return (
    <div className="resumen-viaje">
      <nav className="resumen-breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href={`/grupos/${id}`}>{grupo.nombre}</Link>
        <span>/</span>
        <span>Resumen del Viaje</span>
      </nav>

      <h1 className="resumen-titulo">Resumen del Viaje</h1>
      <p className="resumen-subtitulo">
        {grupo.destino} &middot; {formatearFecha(grupo.fechaInicio)} &ndash;{" "}
        {formatearFecha(grupo.fechaFin)}
      </p>

      <div className="resumen-acciones">
        <button className="btn-exportar" onClick={() => window.print()}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimir / Exportar
        </button>
      </div>

      {/* Resumen General */}
      <div className="resumen-cards">
        <div className="resumen-card">
          <span className="resumen-card__label">Total Gastado</span>
          <span className="resumen-card__valor">
            {formatearMonto(resumenGeneral.totalGastos, resumenGeneral.moneda)}
          </span>
        </div>
        <div className="resumen-card">
          <span className="resumen-card__label">Duración</span>
          <span className="resumen-card__valor">
            {resumenGeneral.duracionDias}{" "}
            {resumenGeneral.duracionDias === 1 ? "día" : "días"}
          </span>
        </div>
        <div className="resumen-card">
          <span className="resumen-card__label">Gastos</span>
          <span className="resumen-card__valor">
            {resumenGeneral.cantidadGastos}
          </span>
        </div>
        <div className="resumen-card">
          <span className="resumen-card__label">Moneda</span>
          <span className="resumen-card__valor">{resumenGeneral.moneda}</span>
        </div>
      </div>

      {/* Por Categoría */}
      <div className="resumen-seccion">
        <h2 className="resumen-seccion__titulo">
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Gastos por Categoría
        </h2>
        {porCategoria.length === 0 ? (
          <p className="resumen-vacio">No hay gastos en este viaje.</p>
        ) : (
          <div>
            {porCategoria.map((cat) => {
              const color = COLORES_CATEGORIA[cat.categoria] || "#95a5a6";
              return (
                <div key={cat.categoria} className="categoria-item">
                  <span className="categoria-nombre">{cat.categoria}</span>
                  <div className="categoria-barra">
                    <div
                      className="categoria-barra__relleno"
                      style={{
                        width: `${Math.min(cat.porcentaje, 100)}%`,
                        background: color,
                      }}
                    />
                    <span className="categoria-barra__texto">
                      {cat.porcentaje}%
                    </span>
                  </div>
                  <span className="categoria-monto">
                    {formatearMonto(cat.monto, resumenGeneral.moneda)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Por Integrante */}
      <div className="resumen-seccion">
        <h2 className="resumen-seccion__titulo">
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Balance por Integrante
        </h2>
        {porIntegrante.length === 0 ? (
          <p className="resumen-vacio">No hay integrantes con actividad.</p>
        ) : (
          <table className="integrante-tabla">
            <thead>
              <tr>
                <th>Integrante</th>
                <th style={{ textAlign: "right" }}>Gastó</th>
                <th style={{ textAlign: "right" }}>Pagó</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {porIntegrante.map((i) => (
                <tr key={i.id}>
                  <td className="integrante-nombre">{i.nombre}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatearMonto(i.gastado, resumenGeneral.moneda)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatearMonto(i.pagado, resumenGeneral.moneda)}
                  </td>
                  <td
                    style={{ textAlign: "right" }}
                    className={
                      i.balance > 0
                        ? "integrante-positivo"
                        : i.balance < 0
                          ? "integrante-negativo"
                          : ""
                    }
                  >
                    {i.balance > 0 ? "+" : ""}
                    {formatearMonto(i.balance, resumenGeneral.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ranking */}
      <div className="resumen-seccion">
        <h2 className="resumen-seccion__titulo">
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
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
            <path d="M4 22h16" />
            <path d="M10 22V5h4v17" />
          </svg>
          Ranking
        </h2>
        <div className="ranking-grid">
          <div className="ranking-card">
            <div className="ranking-badge">&#x1F947;</div>
            <div className="ranking-card__label">Mayor Gasto</div>
            <div className="ranking-card__nombre">
              {ranking.mayorGasto.nombre || "—"}
            </div>
            <div className="ranking-card__monto">
              {ranking.mayorGasto.monto > 0
                ? formatearMonto(
                    ranking.mayorGasto.monto,
                    resumenGeneral.moneda,
                  )
                : "—"}
            </div>
          </div>
          <div className="ranking-card">
            <div className="ranking-badge">&#x1F3C6;</div>
            <div className="ranking-card__label">Mayor Pagador</div>
            <div className="ranking-card__nombre">
              {ranking.mayorPagador.nombre || "—"}
            </div>
            <div className="ranking-card__monto">
              {ranking.mayorPagador.monto > 0
                ? formatearMonto(
                    ranking.mayorPagador.monto,
                    resumenGeneral.moneda,
                  )
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Deudas Pendientes */}
      <div className="resumen-seccion">
        <h2 className="resumen-seccion__titulo">
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
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
          </svg>
          Deudas Pendientes
        </h2>
        {deudas.length === 0 ? (
          <p className="resumen-vacio">
            No hay deudas pendientes. &iexcl;Todo al día!
          </p>
        ) : (
          <div>
            {deudas.map((d, i) => (
              <div
                key={`${d.deudor.id}-${d.acreedor.id}-${i}`}
                className="deuda-item"
              >
                <span className="deuda-personas">
                  <strong>{d.deudor.nombre}</strong> le debe a{" "}
                  <strong>{d.acreedor.nombre}</strong>
                </span>
                <span className="deuda-monto">
                  {formatearMonto(d.monto, d.moneda)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
