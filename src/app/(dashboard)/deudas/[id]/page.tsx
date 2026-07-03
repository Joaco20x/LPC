"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { peticionAutenticada } from "@/shared/servicios/peticionAutenticada";
import "./deuda-detalle.css";

interface UsuarioResumen {
  id: string;
  nombre: string;
  correo: string;
}

interface GrupoResumen {
  id: string;
  nombre: string;
}

interface DeudaDetalle {
  id: string;
  monto: number;
  estado: string;
  saldada: boolean;
  actualizadoEn: string;
  grupo: GrupoResumen;
  deudor: UsuarioResumen;
  acreedor: UsuarioResumen;
}

interface ComprobanteItem {
  id: string;
  idDeuda: string;
  idUsuario: string;
  urlArchivo: string;
  tipoArchivo: string;
  rut: string;
  estado: "pendiente" | "aceptado" | "rechazado";
  aceptadoEn: string | null;
  rechazadoEn: string | null;
  creadoEn: string;
  usuario: UsuarioResumen;
}

const TOKEN_KEY = "lpc_access_token";

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

function DeudaDetallePage() {
  const params = useParams();
  const id = params.id as string;

  const currentUserId =
    typeof window !== "undefined"
      ? (JSON.parse(
          atob((localStorage.getItem(TOKEN_KEY) ?? "").split(".")[1] ?? "{}"),
        )?.idUsuario ?? null)
      : null;

  const [deuda, setDeuda] = useState<DeudaDetalle | null>(null);
  const [comprobantes, setComprobantes] = useState<ComprobanteItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [rut, setRut] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [marcandoPagada, setMarcandoPagada] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const esDeudor = currentUserId === deuda?.deudor.id;
  const esAcreedor = currentUserId === deuda?.acreedor.id;

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const [resDeuda, resComprobantes] = await Promise.all([
          peticionAutenticada(`/api/deudas/${id}`),
          peticionAutenticada(`/api/deudas/${id}/comprobante`),
        ]);
        if (!activo) return;
        const dataDeuda = await resDeuda.json();
        const dataComp = await resComprobantes.json();
        if (dataDeuda.exito) setDeuda(dataDeuda.datos);
        else {
          setError(dataDeuda.mensaje ?? "Error al cargar deuda");
          return;
        }
        if (dataComp.exito) setComprobantes(dataComp.datos);
      } catch {
        if (activo) setError("Error de conexión");
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
    };
  }, [id, version]);

  const recargar = () => setVersion((v) => v + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ tipo: "error", texto: "Selecciona un archivo" });
      return;
    }
    if (!rut.trim()) {
      setMensaje({ tipo: "error", texto: "Ingresa tu RUT" });
      return;
    }

    setSubiendo(true);
    setMensaje(null);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("rut", rut);
      const res = await fetch(`/api/deudas/${id}/comprobante`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.exito) {
        setMensaje({
          tipo: "exito",
          texto: "Comprobante subido correctamente",
        });
        setRut("");
        setArchivo(null);
        recargar();
      } else {
        setMensaje({ tipo: "error", texto: data.mensaje ?? "Error al subir" });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setSubiendo(false);
    }
  };

  const handleAceptar = async (idComp: string) => {
    try {
      const res = await peticionAutenticada(
        `/api/deudas/comprobante/${idComp}/aceptar`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.exito) recargar();
      else
        setMensaje({
          tipo: "error",
          texto: data.mensaje ?? "Error al aceptar",
        });
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    }
  };

  const handleRechazar = async (idComp: string) => {
    try {
      const res = await peticionAutenticada(
        `/api/deudas/comprobante/${idComp}/rechazar`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.exito) recargar();
      else
        setMensaje({
          tipo: "error",
          texto: data.mensaje ?? "Error al rechazar",
        });
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    }
  };

  const handleMarcarPagada = async () => {
    setMarcandoPagada(true);
    setMensaje(null);
    try {
      const res = await peticionAutenticada(`/api/deudas/${id}/pagar`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.exito) {
        setMensaje({ tipo: "exito", texto: "Deuda marcada como pagada" });
        recargar();
      } else {
        setMensaje({ tipo: "error", texto: data.mensaje });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setMarcandoPagada(false);
    }
  };

  if (cargando) {
    return (
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
    );
  }

  if (error || !deuda) {
    return (
      <div className="dashboard-cuerpo">
        <div className="dashboard-vacio">
          <p style={{ color: "var(--color-texto-secundario)" }}>
            {error ?? "Deuda no encontrada"}
          </p>
          <Link
            href="/deudas"
            style={{
              color: "var(--color-acento)",
              marginTop: "1rem",
              display: "block",
            }}
          >
            Volver a deudas
          </Link>
        </div>
      </div>
    );
  }

  const estadoLabel =
    deuda.saldada || deuda.estado === "pagada" ? "Pagada" : "Pendiente";

  return (
    <div className="dashboard-cuerpo deuda-detalle">
      <header className="deuda-detalle__header">
        <p className="deuda-detalle__breadcrumb">
          <Link href="/deudas">Deudas</Link> <span>/</span> Detalle
        </p>
        <h1 className="deuda-detalle__titulo">
          Deuda con {esDeudor ? deuda.acreedor.nombre : deuda.deudor.nombre}
        </h1>
        <span
          className={`deuda-detalle__estado deuda-detalle__estado--${deuda.saldada || deuda.estado === "pagada" ? "pagada" : "pendiente"}`}
        >
          {estadoLabel}
        </span>
      </header>

      {mensaje && (
        <div
          className={`comprobante-form__mensaje comprobante-form__mensaje--${mensaje.tipo}`}
        >
          {mensaje.texto}
        </div>
      )}

      <p className="deuda-detalle__monto">{formatearMonto(deuda.monto)}</p>

      <div className="deuda-detalle__info-grid">
        <div className="deuda-detalle__info-item">
          <p className="deuda-detalle__info-label">Grupo</p>
          <p className="deuda-detalle__info-value">{deuda.grupo.nombre}</p>
        </div>
        <div className="deuda-detalle__info-item">
          <p className="deuda-detalle__info-label">
            {esDeudor ? "Acreedor" : "Deudor"}
          </p>
          <p className="deuda-detalle__info-value">
            {esDeudor ? deuda.acreedor.nombre : deuda.deudor.nombre}
          </p>
        </div>
        <div className="deuda-detalle__info-item">
          <p className="deuda-detalle__info-label">Correo</p>
          <p className="deuda-detalle__info-value">
            {esDeudor ? deuda.acreedor.correo : deuda.deudor.correo}
          </p>
        </div>
        <div className="deuda-detalle__info-item">
          <p className="deuda-detalle__info-label">Actualizado</p>
          <p className="deuda-detalle__info-value">
            {formatearFecha(deuda.actualizadoEn)}
          </p>
        </div>
      </div>

      {esDeudor && !deuda.saldada && deuda.estado !== "pagada" && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "#f9f9f9",
              borderRadius: "4px",
              border: "1px solid var(--color-borde)",
            }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                flex: 1,
                color: "var(--color-texto-secundario)",
              }}
            >
              Si ya realizaste el pago fuera de la plataforma, puedes marcarlo
              directamente.
            </span>
            <button
              onClick={handleMarcarPagada}
              disabled={marcandoPagada}
              className="btn-primary"
              style={{ whiteSpace: "nowrap" }}
            >
              {marcandoPagada ? "Marcando…" : "Marcar como pagada"}
            </button>
          </div>

          <h2 className="deuda-detalle__section-title">
            Subir comprobante de pago
          </h2>
          <form className="comprobante-form" onSubmit={handleSubmit}>
            <div className="comprobante-form__group">
              <label className="comprobante-form__label" htmlFor="rut">
                RUT (con guion, ej: 12345678-5)
              </label>
              <input
                id="rut"
                type="text"
                className="comprobante-form__input"
                placeholder="12345678-5"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
              />
            </div>
            <div className="comprobante-form__group">
              <label className="comprobante-form__label" htmlFor="archivo">
                Comprobante (imagen o PDF)
              </label>
              <input
                id="archivo"
                type="file"
                className="comprobante-form__file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="comprobante-form__actions">
              <button type="submit" className="btn-primary" disabled={subiendo}>
                {subiendo ? "Subiendo..." : "Subir comprobante"}
              </button>
            </div>
          </form>
        </>
      )}

      <h2 className="deuda-detalle__section-title">
        Historial de comprobantes
      </h2>
      {comprobantes.length === 0 ? (
        <div className="dashboard-vacio" style={{ padding: "2rem 0" }}>
          <p style={{ color: "var(--color-texto-suave)" }}>
            No hay comprobantes aún
          </p>
        </div>
      ) : (
        <div className="comprobante-lista">
          {comprobantes.map((c) => (
            <div key={c.id} className="comprobante-item">
              <div className="comprobante-item__info">
                <p className="comprobante-item__nombre">
                  {c.tipoArchivo === "application/pdf" ? "PDF" : "Imagen"} —
                  RUT: {c.rut}
                </p>
                <p className="comprobante-item__meta">
                  Subido por {c.usuario.nombre} — {formatearFecha(c.creadoEn)}
                </p>
              </div>
              <span
                className={`comprobante-item__estado comprobante-item__estado--${c.estado}`}
              >
                {c.estado === "aceptado"
                  ? "Aceptado"
                  : c.estado === "rechazado"
                    ? "Rechazado"
                    : "Pendiente"}
              </span>
              <div className="comprobante-item__acciones">
                <a
                  href={c.urlArchivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ver"
                >
                  Ver
                </a>
                {esAcreedor && c.estado === "pendiente" && (
                  <>
                    <button
                      className="btn-aceptar"
                      onClick={() => handleAceptar(c.id)}
                    >
                      Aceptar
                    </button>
                    <button
                      className="btn-rechazar"
                      onClick={() => handleRechazar(c.id)}
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaginaDeudaDetalle() {
  return <DeudaDetallePage />;
}
