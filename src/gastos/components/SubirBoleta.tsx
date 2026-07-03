"use client";

import { useRef, useEffect } from "react";
import { useSubirBoleta } from "./useSubirBoleta";

interface Props {
  onUrlCambio: (url: string | null) => void;
  onDatosOCR: (
    monto: number | null,
    fecha: string | null,
    descripcion: string | null,
  ) => void;
  urlActual?: string;
}

export default function SubirBoleta({
  onUrlCambio,
  onDatosOCR,
  urlActual,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ultimaUrlNotificada = useRef<string | null | undefined>(undefined);
  const { estado, ocr, subir, limpiar, ejecutarOCR } = useSubirBoleta();

  const urlFinal =
    estado.tipo === "completado" ? estado.url : (urlActual ?? null);

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    subir(file);
  };

  const manejarOCR = () => {
    ejecutarOCR();
  };

  useEffect(() => {
    if (ocr.tipo === "completado") {
      onDatosOCR(ocr.monto, ocr.fecha, ocr.descripcion);
    }
  }, [ocr, onDatosOCR]);

  useEffect(() => {
    if (
      estado.tipo === "completado" &&
      estado.url !== ultimaUrlNotificada.current
    ) {
      ultimaUrlNotificada.current = estado.url;
      onUrlCambio(estado.url);
    }
    if (estado.tipo === "inactivo" && ultimaUrlNotificada.current !== null) {
      ultimaUrlNotificada.current = null;
      onUrlCambio(null);
    }
  }, [estado, onUrlCambio, urlActual]);

  return (
    <div className="subir-boleta">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={manejarArchivo}
        style={{ display: "none" }}
      />

      {estado.tipo === "inactivo" && !urlFinal && (
        <button
          type="button"
          className="subir-boleta-btn"
          onClick={() => inputRef.current?.click()}
        >
          <span className="subir-boleta-icono">📎</span>
          Adjuntar boleta
        </button>
      )}

      {(estado.tipo === "comprimiendo" || estado.tipo === "subiendo") && (
        <div className="subir-boleta-progreso">
          <div className="subir-boleta-spinner" />
          <span>
            {estado.tipo === "comprimiendo"
              ? "Comprimiendo..."
              : "Subiendo imagen..."}
          </span>
        </div>
      )}

      {estado.tipo === "error" && (
        <div className="subir-boleta-error">
          <span>{estado.mensaje}</span>
          <button
            type="button"
            className="subir-boleta-reintentar"
            onClick={() => {
              limpiar();
              inputRef.current?.click();
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {urlFinal && (
        <div className="subir-boleta-preview">
          <div className="subir-boleta-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlFinal} alt="Vista previa de la boleta" />
          </div>
          <div className="subir-boleta-info">
            <span className="subir-boleta-nombre">
              {estado.tipo === "completado" ? estado.nombre : "Boleta adjunta"}
            </span>
            <div className="subir-boleta-acciones">
              <button
                type="button"
                className="subir-boleta-accion"
                onClick={() => inputRef.current?.click()}
              >
                Cambiar
              </button>
              <button
                type="button"
                className="subir-boleta-accion subir-boleta-accion--ocr"
                onClick={manejarOCR}
                disabled={ocr.tipo === "procesando"}
              >
                {ocr.tipo === "procesando"
                  ? "Extrayendo datos..."
                  : "Extraer datos con OCR"}
              </button>
              <button
                type="button"
                className="subir-boleta-accion subir-boleta-accion--eliminar"
                onClick={() => limpiar()}
              >
                Eliminar
              </button>
            </div>
          </div>

          {ocr.tipo === "completado" && (
            <div className="subir-boleta-ocr">
              {ocr.descripcion !== null ? (
                <p className="subir-boleta-ocr-item">
                  Descripción detectada: <strong>{ocr.descripcion}</strong>
                </p>
              ) : (
                <p className="subir-boleta-ocr-item">
                  No se reconoció la descripción.
                </p>
              )}
              {ocr.monto !== null && (
                <p className="subir-boleta-ocr-item">
                  Monto detectado:{" "}
                  <strong>${ocr.monto.toLocaleString("es-CL")}</strong>
                </p>
              )}
              {ocr.fecha !== null && (
                <p className="subir-boleta-ocr-item">
                  Fecha detectada: <strong>{ocr.fecha}</strong>
                </p>
              )}
              {ocr.monto === null &&
                ocr.fecha === null &&
                ocr.descripcion === null && (
                  <p className="subir-boleta-ocr-item">
                    No se pudieron extraer datos automáticamente.
                  </p>
                )}
            </div>
          )}

          {ocr.tipo === "error" && (
            <div className="subir-boleta-ocr-error">{ocr.mensaje}</div>
          )}
        </div>
      )}
    </div>
  );
}
