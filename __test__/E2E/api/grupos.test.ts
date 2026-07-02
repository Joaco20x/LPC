import {
  controladorCrearGrupo,
  controladorObtenerGrupos,
  controladorObtenerDetalleGrupo,
  controladorActualizarPresupuesto,
} from "@/grupos/controllers/grupos.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

jest.mock("@/shared/di/crearDependencias", () => {
  const mockGrupoRepo = {
    crear: jest.fn(),
    obtenerDetalle: jest.fn(),
    actualizarPresupuesto: jest.fn(),
  };
  const mockMiembroRepo = {
    buscarPorGrupo: jest.fn(),
    crearMuchas: jest.fn(),
    buscarPorUsuario: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
  const mockUsuarioRepo = {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmails: jest.fn(),
    buscarPorOauth: jest.fn(),
    crear: jest.fn(),
    actualizarContrasena: jest.fn(),
  };

  return {
    crearDependencias: jest.fn(() => ({
      grupoRepo: mockGrupoRepo,
      miembroGrupoRepo: mockMiembroRepo,
      usuarioRepo: mockUsuarioRepo,
      sesionRepo: {
        crear: jest.fn(),
        buscarPorTokenHash: jest.fn(),
        actualizarTokenHash: jest.fn(),
        eliminarPorTokenHash: jest.fn(),
        eliminarPorIdUsuario: jest.fn(),
      },
      gastoRepo: {
        crear: jest.fn(),
        obtenerTodos: jest.fn(),
        obtenerPorId: jest.fn(),
      },
      deudaRepo: { crearMuchas: jest.fn(), obtenerPendientes: jest.fn() },
      divisionGastoRepo: { crearMuchas: jest.fn() },
      tokenRecuperacionRepo: {
        invalidarPorIdUsuario: jest.fn(),
        crear: jest.fn(),
        buscarTokenValido: jest.fn(),
        marcarComoUsado: jest.fn(),
      },
      db: { transaction: jest.fn((fn: any) => fn({})) },
    })),
  };
});

jest.mock("@/shared/libs/prismaDatabaseService", () => ({
  PrismaDatabaseService: { transaction: jest.fn((fn: any) => fn({})) },
}));

jest.mock("@/shared/servicios/tasasCambio", () => ({
  obtenerTasaCambio: jest.fn().mockResolvedValue({ tasa: 850, fuente: "api" }),
}));

const tokens = generarTokens({
  idUsuario: "user-test",
  correo: "test@test.com",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/grupos", () => {
  it("retorna 201 para grupo válido", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorEmails.mockResolvedValue([
      { id: "user-2", nombre: "Invitado", correo: "invitado@test.com" },
    ]);
    deps.grupoRepo.crear.mockResolvedValue({ id: "grupo-1" });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
      cuerpo: {
        nombre: "Viaje Chile",
        pais: "Chile",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-07-10",
        correosIntegrantes: ["invitado@test.com"],
      },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(201);
  });

  it("retorna 400 para datos inválidos", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
      cuerpo: { nombre: "", correosIntegrantes: [] },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      cuerpo: { nombre: "Viaje" },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 401 con token inválido", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      token: "token-manipulado",
      cuerpo: { nombre: "Viaje" },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 500 si hay correos no registrados", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorEmails.mockResolvedValue([
      { id: "user-2", nombre: "Invitado", correo: "invitado@test.com" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
      cuerpo: {
        nombre: "Viaje",
        pais: "Chile",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-07-10",
        correosIntegrantes: ["invitado@test.com", "no-registrado@test.com"],
      },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(500);
  });

  it("retorna 500 si falla la creación en el servicio", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorEmails.mockRejectedValue(
      new Error("Error de BD"),
    );

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
      cuerpo: {
        nombre: "Viaje",
        pais: "Chile",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-07-10",
        correosIntegrantes: ["invitado@test.com"],
      },
    });

    const respuesta = await controladorCrearGrupo(req);
    expect(respuesta.status).toBe(500);
  });
});

describe("GET /api/grupos", () => {
  it("retorna 200 con grupos del usuario", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.miembroGrupoRepo.buscarPorUsuario.mockResolvedValue([
      {
        rol: "admin",
        grupo: {
          id: "g1",
          nombre: "Viaje",
          destino: "Chile",
          fechaInicio: new Date(),
          fechaFin: new Date(),
          monedaBase: "CLP",
          _count: { miembros: 2 },
        },
      } as any,
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerGrupos(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 500 si falla al obtener grupos", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.miembroGrupoRepo.buscarPorUsuario.mockRejectedValue(
      new Error("Error de BD"),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerGrupos(req);
    expect(respuesta.status).toBe(500);
  });
});

describe("GET /api/grupos/[id]", () => {
  it("retorna 200 con detalle del grupo", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      nombre: "Viaje",
      monedaBase: "CLP",
      gastos: [],
    } as any);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDetalleGrupo(req, { id: "g1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 404 si el grupo no existe", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/no-existe",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDetalleGrupo(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });

  it("retorna 500 si falla al obtener detalle", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockRejectedValue(
      new Error("Error inesperado"),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDetalleGrupo(req, { id: "g1" });
    expect(respuesta.status).toBe(500);
  });

  it("retorna 200 con gastos en multiples monedas", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      nombre: "Viaje",
      monedaBase: "CLP",
      gastos: [
        { monto: 100, moneda: "USD" },
        { monto: 50000, moneda: "CLP" },
        { monto: 50, moneda: "EUR" },
      ],
    } as any);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDetalleGrupo(req, { id: "g1" });
    expect(respuesta.status).toBe(200);
  });
});

describe("PATCH /api/grupos/[id]/presupuesto", () => {
  it("retorna 200 cuando admin actualiza presupuesto", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-test" }, rol: "admin" }],
    } as any);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/grupos/g1/presupuesto",
      token: tokens.accessToken,
      cuerpo: { presupuestoPorPersona: 50000, umbralAlerta: 80 },
    });

    const respuesta = await controladorActualizarPresupuesto(req, { id: "g1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 403 cuando no-admin intenta actualizar presupuesto", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-test" }, rol: "miembro" }],
    } as any);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/grupos/g1/presupuesto",
      token: tokens.accessToken,
      cuerpo: { presupuestoPorPersona: 50000 },
    });

    const respuesta = await controladorActualizarPresupuesto(req, { id: "g1" });
    expect(respuesta.status).toBe(403);
  });

  it("retorna 400 con valores invalidos", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-test" }, rol: "admin" }],
    } as any);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/grupos/g1/presupuesto",
      token: tokens.accessToken,
      cuerpo: { presupuestoPorPersona: -1 },
    });

    const respuesta = await controladorActualizarPresupuesto(req, { id: "g1" });
    expect(respuesta.status).toBe(400);
  });

  it("retorna 404 cuando el grupo no existe", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.grupoRepo.obtenerDetalle.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/grupos/no-existe/presupuesto",
      token: tokens.accessToken,
      cuerpo: { presupuestoPorPersona: 50000 },
    });

    const respuesta = await controladorActualizarPresupuesto(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/grupos/g1/presupuesto",
      cuerpo: { presupuestoPorPersona: 50000 },
    });

    const respuesta = await controladorActualizarPresupuesto(req, { id: "g1" });
    expect(respuesta.status).toBe(401);
  });
});
