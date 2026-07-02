/**
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubirBoleta } from "@/gastos/components/useSubirBoleta";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockCreateObjectURL = jest.fn(() => "blob:mock");
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = jest.fn();

let imgOnload: (() => void) | null = null;
let imgOnerror: (() => void) | null = null;

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 100;
  naturalHeight = 100;
  src = "";
  width = 100;
  height = 100;
  constructor() {
    imgOnload = () => this.onload?.();
    imgOnerror = () => this.onerror?.();
  }
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

async function subirYCompletar(hook: ReturnType<typeof useSubirBoleta>) {
  const file = crearMockFile();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ exito: true, datos: { url: "/uploads/gastos/boleta.jpg" } }),
  });
  act(() => {
    hook.subir(file);
  });
  act(() => {
    imgOnload?.();
  });
  await waitFor(() => {
    expect(hook.estado.tipo).toBe("completado");
  });
}

describe("useSubirBoleta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    imgOnload = null;
    imgOnerror = null;
  });

  describe("subir", () => {
    it("inicia en inactivo", () => {
      const { result } = renderHook(() => useSubirBoleta());
      expect(result.current.estado).toEqual({ tipo: "inactivo" });
      expect(result.current.ocr).toEqual({ tipo: "inactivo" });
    });

    it("flujo exitoso: inactivo → comprimiendo → subiendo → completado", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exito: true, datos: { url: "/uploads/gastos/test.jpg" } }),
      });

      const { result } = renderHook(() => useSubirBoleta());
      const file = crearMockFile();

      act(() => { result.current.subir(file); });
      expect(result.current.estado).toEqual({ tipo: "comprimiendo" });

      act(() => { imgOnload?.(); });
      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("subiendo");
      });

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
      const { result } = renderHook(() => useSubirBoleta());
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      act(() => { result.current.subir(crearMockFile()); });
      act(() => { imgOnload?.(); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Network error");
        }
      });
    });

    it("error HTTP: usa mensaje del body", async () => {
      const { result } = renderHook(() => useSubirBoleta());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ exito: false, mensaje: "Archivo muy grande" }),
      });

      act(() => { result.current.subir(crearMockFile()); });
      act(() => { imgOnload?.(); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Archivo muy grande");
        }
      });
    });

    it("error HTTP sin mensaje: usa default", async () => {
      const { result } = renderHook(() => useSubirBoleta());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error(""); },
      });

      act(() => { result.current.subir(crearMockFile()); });
      act(() => { imgOnload?.(); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error al subir la imagen");
        }
      });
    });

    it("error de carga de imagen", async () => {
      const { result } = renderHook(() => useSubirBoleta());

      act(() => { result.current.subir(crearMockFile()); });
      act(() => { imgOnerror?.(); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error al cargar la imagen");
        }
      });
    });

    it("error desconocido: mensaje generico", async () => {
      const { result } = renderHook(() => useSubirBoleta());
      mockFetch.mockRejectedValueOnce("string error");

      act(() => { result.current.subir(crearMockFile()); });
      act(() => { imgOnload?.(); });

      await waitFor(() => {
        expect(result.current.estado.tipo).toBe("error");
        if (result.current.estado.tipo === "error") {
          expect(result.current.estado.mensaje).toBe("Error desconocido");
        }
      });
    });
  });

  describe("ejecutarOCR", () => {
    it("extrae monto y fecha del texto de la boleta", async () => {
      mockRecognize.mockResolvedValueOnce({
        data: { text: "Total: $15.430\nFecha: 15/03/2025" },
      });

      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar(result.current);

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
      await subirYCompletar(result.current);

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
      await subirYCompletar(result.current);

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
      await subirYCompletar(result.current);

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
      await subirYCompletar(result.current);

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
      const { result } = renderHook(() => useSubirBoleta());
      await subirYCompletar(result.current);

      act(() => { result.current.limpiar(); });
      expect(result.current.estado).toEqual({ tipo: "inactivo" });
      expect(result.current.ocr).toEqual({ tipo: "inactivo" });
    });
  });
});
