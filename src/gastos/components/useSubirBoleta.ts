"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Tesseract from "tesseract.js";
import { obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";

const MAX_BYTES = 500 * 1024;
const CALIDAD_INICIAL = 0.8;
const ANCHO_MAXIMO = 1920;

export type EstadoSubida =
  | { tipo: "inactivo" }
  | { tipo: "comprimiendo" }
  | { tipo: "subiendo"; progreso: number }
  | { tipo: "completado"; url: string; nombre: string }
  | { tipo: "error"; mensaje: string };

export type EstadoOCR =
  | { tipo: "inactivo" }
  | { tipo: "procesando" }
  | { tipo: "completado"; monto: number | null; fecha: string | null }
  | { tipo: "error"; mensaje: string };

function comprimirImagen(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > ANCHO_MAXIMO) {
        height = Math.round((height * ANCHO_MAXIMO) / width);
        width = ANCHO_MAXIMO;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const comprimirConCalidad = (calidad: number): Promise<Blob> =>
        new Promise((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", calidad),
        );
      (async () => {
        let calidad = CALIDAD_INICIAL;
        let blob = await comprimirConCalidad(calidad);
        while (blob.size > MAX_BYTES && calidad > 0.1) {
          calidad -= 0.1;
          blob = await comprimirConCalidad(calidad);
        }
        resolve(blob);
      })();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar la imagen"));
    };
    img.src = url;
  });
}

function extraerMonto(texto: string): number | null {
  const patrones = [
    /total\s*[:.]?\s*\$?\s*([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gim,
    /\$\s*([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/g,
    /([\d]+(?:[.,]\d{3})*(?:[.,]\d{2}))\s*CLP/gi,
    /([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s*CLP/gi,
    /importe\s*[:.]?\s*\$?\s*([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gim,
    /monto\s*[:.]?\s*\$?\s*([\d]+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gim,
  ];
  const numeros: number[] = [];
  for (const patron of patrones) {
    const matches = texto.matchAll(patron);
    for (const m of matches) {
      const limpio = m[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(limpio);
      if (!isNaN(num) && num > 0) numeros.push(num);
    }
  }
  return numeros.length > 0 ? Math.max(...numeros) : null;
}

function extraerFecha(texto: string): string | null {
  const patrones = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      if (patron === patrones[2]) {
        const [, y, m, d] = match;
        return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
      const [, a, b, c] = match;
      return `${a.padStart(2, "0")}/${b.padStart(2, "0")}/${c}`;
    }
  }
  return null;
}

export function useSubirBoleta() {
  const [estado, setEstado] = useState<EstadoSubida>({ tipo: "inactivo" });
  const [ocr, setOcr] = useState<EstadoOCR>({ tipo: "inactivo" });
  const workerRef = useRef<Tesseract.Worker | null>(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const limpiar = useCallback(() => {
    setEstado({ tipo: "inactivo" });
    setOcr({ tipo: "inactivo" });
  }, []);

  const subir = useCallback(async (file: File) => {
    setEstado({ tipo: "comprimiendo" });
    try {
      const comprimida = await comprimirImagen(file);
      setEstado({ tipo: "subiendo", progreso: 0 });

      const formData = new FormData();
      formData.append("imagen", comprimida, file.name);

      const token = obtenerAccessToken();
      const res = await fetch("/api/imagenes/subir", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.mensaje || "Error al subir la imagen");
      }

      const body = await res.json();
      setEstado({
        tipo: "completado",
        url: body.datos.url,
        nombre: file.name,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error desconocido";
      setEstado({ tipo: "error", mensaje });
    }
  }, []);

  const ejecutarOCR = useCallback(async () => {
    if (estado.tipo !== "completado") return;
    setOcr({ tipo: "procesando" });
    try {
      if (!workerRef.current) {
        workerRef.current = await Tesseract.createWorker("spa");
      }
      const urlImagen = estado.url;
      const { data } = await workerRef.current.recognize(urlImagen);
      const texto = data.text;
      const monto = extraerMonto(texto);
      const fecha = extraerFecha(texto);
      setOcr({ tipo: "completado", monto, fecha });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al procesar OCR";
      setOcr({ tipo: "error", mensaje });
    }
  }, [estado]);

  return { estado, ocr, subir, limpiar, ejecutarOCR };
}
