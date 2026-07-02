/**
 * @jest-environment jsdom
 */

import {
  encolarOperacion,
  procesarCola,
  obtenerCantidadPendientes,
  suscribirCola,
} from "@/shared/servicios/colaOffline";

const CLAVE_COLA = "lpc_cola_offline";

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("encolarOperacion", () => {
  it("agrega una operacion a la cola en localStorage", () => {
    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: { monto: 1000 },
    });

    const cola = JSON.parse(localStorage.getItem(CLAVE_COLA)!);
    expect(cola).toHaveLength(1);
    expect(cola[0].tipo).toBe("crear");
    expect(cola[0].endpoint).toBe("/api/gastos");
    expect(cola[0].id).toBeDefined();
    expect(cola[0].timestamp).toBeDefined();
  });

  it("agrega multiples operaciones en orden FIFO", () => {
    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos/1",
      metodo: "POST",
      cuerpo: {},
    });
    encolarOperacion({
      tipo: "editar",
      endpoint: "/api/gastos/1",
      metodo: "PUT",
      cuerpo: {},
    });

    const cola = JSON.parse(localStorage.getItem(CLAVE_COLA)!);
    expect(cola).toHaveLength(2);
    expect(cola[0].tipo).toBe("crear");
    expect(cola[1].tipo).toBe("editar");
  });
});

describe("obtenerCantidadPendientes", () => {
  it("retorna 0 cuando la cola está vacía", () => {
    expect(obtenerCantidadPendientes()).toBe(0);
  });

  it("retorna la cantidad de operaciones pendientes", () => {
    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: {},
    });
    encolarOperacion({
      tipo: "eliminar",
      endpoint: "/api/gastos/1",
      metodo: "DELETE",
      cuerpo: {},
    });
    expect(obtenerCantidadPendientes()).toBe(2);
  });
});

describe("procesarCola", () => {
  it("retorna 0 exitosos si la cola está vacía", async () => {
    const resultado = await procesarCola();
    expect(resultado).toEqual({ exitosos: 0, errores: [] });
  });

  it("procesa operaciones exitosas y limpia la cola", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: { monto: 500 },
    });

    const resultado = await procesarCola();
    expect(resultado).toEqual({ exitosos: 1, errores: [] });
    expect(JSON.parse(localStorage.getItem(CLAVE_COLA)!)).toHaveLength(0);
  });

  it("registra errores para operaciones fallidas", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ mensaje: "Datos inválidos" }),
    });

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: {},
    });

    const resultado = await procesarCola();
    expect(resultado.exitosos).toBe(0);
    expect(resultado.errores).toContain("Datos inválidos");
  });

  it("mantiene operaciones con error en la cola", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ mensaje: "Error" }),
    });

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: {},
    });

    await procesarCola();
    const cola = JSON.parse(localStorage.getItem(CLAVE_COLA)!);
    expect(cola).toHaveLength(1);
  });

  it("maneja errores de red", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: {},
    });

    const resultado = await procesarCola();
    expect(resultado.exitosos).toBe(0);
    expect(resultado.errores).toContain("Error de red");
  });

  it("procesa operaciones secuencialmente y mezcla exitos/errores", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ mensaje: "No encontrado" }),
      })
      .mockResolvedValueOnce({ ok: true });

    global.fetch = fetchMock;

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos/1",
      metodo: "POST",
      cuerpo: {},
    });
    encolarOperacion({
      tipo: "editar",
      endpoint: "/api/gastos/1",
      metodo: "PUT",
      cuerpo: {},
    });
    encolarOperacion({
      tipo: "eliminar",
      endpoint: "/api/gastos/1",
      metodo: "DELETE",
      cuerpo: {},
    });

    const resultado = await procesarCola();
    expect(resultado.exitosos).toBe(2);
    expect(resultado.errores).toHaveLength(1);
  });
});

describe("suscribirCola", () => {
  it("llama al callback cuando se dispara el evento colaOfflineCambio", () => {
    const callback = jest.fn();
    suscribirCola(callback);

    globalThis.dispatchEvent(new CustomEvent("colaOfflineCambio"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("retorna una función para desuscribirse", () => {
    const callback = jest.fn();
    const unsubscribe = suscribirCola(callback);

    unsubscribe();
    globalThis.dispatchEvent(new CustomEvent("colaOfflineCambio"));
    expect(callback).not.toHaveBeenCalled();
  });

  it("encolarOperacion dispara el evento colaOfflineCambio", () => {
    const callback = jest.fn();
    suscribirCola(callback);

    encolarOperacion({
      tipo: "crear",
      endpoint: "/api/gastos",
      metodo: "POST",
      cuerpo: {},
    });
    expect(callback).toHaveBeenCalled();
  });
});

describe("colaOffline — casos borde", () => {
  it("tolera localStorage corrupto", () => {
    localStorage.setItem("lpc_cola_offline", "{datos corruptos}");
    expect(obtenerCantidadPendientes()).toBe(0);
  });

  it("tolera localStorage indefinido", () => {
    const original = localStorage;
    Object.defineProperty(globalThis, "localStorage", { value: undefined });

    expect(obtenerCantidadPendientes()).toBe(0);

    Object.defineProperty(globalThis, "localStorage", { value: original });
  });
});
