/**
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubirBoleta } from "@/gastos/components/useSubirBoleta";

const mockFetch = jest.fn();
global.fetch = mockFetch;

URL.createObjectURL = jest.fn(() => "blob:mock");
URL.revokeObjectURL = jest.fn();

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 100;
  height = 100;
  set src(_val: string) {
    queueMicrotask(() => this.onload?.());
  }
  get src() { return ""; }
}
global.Image = MockImage as any;

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() })) as any;
HTMLCanvasElement.prototype.toBlob = jest.fn(function (
  this: HTMLCanvasElement,
  cb: BlobCallback,
) {
  cb(new Blob(["fake-image"], { type: "image/jpeg" }));
}) as any;

jest.mock("@/shared/servicios/almacenamientoTokens", () => ({
  obtenerAccessToken: jest.fn(() => "mock-token"),
}));

const mockRecognize = jest.fn();
const mockTerminate = jest.fn();
jest.mock("tesseract.js", () => ({
  createWorker: jest.fn(() => ({
    recognize: mockRecognize,
    terminate: mockTerminate,
  })),
}));

function crearMockFile(contenido = "fake", nombre = "boleta.jpg", tipo = "image/jpeg") {
  return new File([contenido], nombre, { type: tipo });
}

describe("useSubirBoleta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("subir", () => {
    it("inicia en inactivo", () => {
      const { result } = renderHook(() => useSubirBoleta());
      expect(result.current.estado).toEqual({ tipo: "inactivo" });
      expect(result.current.ocr).toEqual({ tipo: "inactivo" });
    });

    it("flujo exitoso: inactivo → comprimiendo → completado", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exito: true, datos: { url: "/uploads/gastos/test.jpg" } }),
      });

      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });
      expect(result.current.estado).toEqual({ tipo: "comprimiendo" });

      await waitFor(() => {
        const s = result.current.estado;
        expect(s.tipo).toBe("completado");
        if (s.tipo === "completado") {
          expect(s.url).toBe("/uploads/gastos/test.jpg");
          expect(s.nombre).toBe("boleta.jpg");
        }
      });
    });

    it("error de red: setea estado error con mensaje", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Network error");
        }
      });
    });

    it("error HTTP: usa mensaje del body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ exito: false, mensaje: "Archivo muy grande" }),
      });
      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Archivo muy grande");
        }
      });
    });

    it("error HTTP sin mensaje: usa default", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error(""); },
      });
      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error al subir la imagen");
        }
      });
    });

    it("error de carga de imagen", async () => {
      class MockImageError {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 100;
        height = 100;
        set src(_val: string) {
          queueMicrotask(() => this.onerror?.());
        }
      }
      global.Image = MockImageError as any;

      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error al cargar la imagen");
        }
      });

      global.Image = MockImage as any;
    });

    it("error desconocido: mensaje generico", async () => {
      mockFetch.mockRejectedValueOnce("string error");
      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error desconocido");
        }
      });
    });
  });

  describe("ejecutarOCR", () => {
    async function subirYCompletar() {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exito: true, datos: { url: "/uploads/gastos/test.jpg" } }),
      });
    }

    it("extrae monto y fecha del texto de la boleta", async () => {
      mockRecognize.mockResolvedValueOnce({
        data: { text: "Total: $15.430\nFecha: 15/03/2025" },
      });

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar();

      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.ejecutarOCR(); });
      expect(result.current.ocr.tipo).toBe("procesando");

      await waitFor(() => {
        expect(result.current.ocr.tipo).toBe("completado");
        if (result.current.ocr.tipo === "completado") {
          expect(result.current.ocr.monto).toBe(15430);
          expect(result.current.ocr.fecha).toBe("15/03/2025");
        }
      });
    });

    it("extrae monto con formato $X.XXX", async () => {
      mockRecognize.mockResolvedValueOnce({
        data: { text: "Importe: $1.500.000" },
      });

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar();
      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.ejecutarOCR(); });
      await waitFor(() => {
        if (result.current.ocr.tipo === "completado") {
          expect(result.current.ocr.monto).toBe(1500000);
        }
      });
    });

    it("extrae monto con CLP", async () => {
      mockRecognize.mockResolvedValueOnce({
        data: { text: "25.990 CLP" },
      });

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar();
      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.ejecutarOCR(); });
      await waitFor(() => {
        if (result.current.ocr.tipo === "completado") {
          expect(result.current.ocr.monto).toBe(25990);
        }
      });
    });

    it("retorna null si no encuentra monto", async () => {
      mockRecognize.mockResolvedValueOnce({
        data: { text: "Sin números aquí" },
      });

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar();
      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.ejecutarOCR(); });
      await waitFor(() => {
        if (result.current.ocr.tipo === "completado") {
          expect(result.current.ocr.monto).toBeNull();
        }
      });
    });

    it("no se ejecuta si no hay imagen completada", async () => {
      const { result } = renderHook(() => useSubirBoleta());
      act(() => { result.current.ejecutarOCR(); });
      expect(result.current.ocr.tipo).toBe("inactivo");
    });

    it("error de OCR: setea estado error", async () => {
      mockRecognize.mockRejectedValueOnce(new Error("OCR falló"));

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar();
      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.ejecutarOCR(); });
      await waitFor(() => {
        expect(result.current.ocr.tipo).toBe("error");
        if (result.current.ocr.tipo === "error") {
          expect(result.current.ocr.mensaje).toBe("OCR falló");
        }
      });
    });
  });

  describe("limpiar", () => {
    it("resetea estado y OCR a inactivo", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exito: true, datos: { url: "/uploads/gastos/test.jpg" } }),
      });

      const { result } = renderHook(() => useSubirBoleta());
      act(() => { result.current.subir(crearMockFile()); });
      await waitFor(() => { expect(result.current.estado.tipo).toBe("completado"); });

      act(() => { result.current.limpiar(); });
      expect(result.current.estado).toEqual({ tipo: "inactivo" });
      expect(result.current.ocr).toEqual({ tipo: "inactivo" });
    });
  });
});
