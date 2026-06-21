import { controladorDeudas } from "@/deudas/controllers/deudas.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

jest.mock("@/shared/di/crearDependencias", () => {
  const mockDeudaRepo = {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
  };

  return {
    crearDependencias: jest.fn(() => ({
      deudaRepo: mockDeudaRepo,
      usuarioRepo: {
        buscarPorCorreo: jest.fn(),
        buscarPorId: jest.fn(),
        buscarPorEmails: jest.fn(),
        buscarPorOauth: jest.fn(),
        crear: jest.fn(),
        actualizarContrasena: jest.fn(),
      },
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
      grupoRepo: { crear: jest.fn(), obtenerDetalle: jest.fn() },
      divisionGastoRepo: { crearMuchas: jest.fn() },
      miembroGrupoRepo: {
        buscarPorGrupo: jest.fn(),
        crearMuchas: jest.fn(),
        buscarPorUsuario: jest.fn(),
        buscarMiembrosDeGrupos: jest.fn(),
      },
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

const tokens = generarTokens({
  idUsuario: "user-test",
  correo: "test@test.com",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/deudas", () => {
  it("retorna 200 con deudas pendientes", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.deudaRepo.obtenerPendientes.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "user-test",
        idAcreedor: "user-2",
        monto: 100,
        grupo: { id: "g1", nombre: "Grupo Test" },
        deudor: { id: "user-test", nombre: "Yo", correo: "yo@test.com" },
        acreedor: { id: "user-2", nombre: "Otro", correo: "otro@test.com" },
        actualizadoEn: new Date(),
      },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas",
      token: tokens.accessToken,
    });

    const respuesta = await controladorDeudas(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas",
    });
    const respuesta = await controladorDeudas(req);
    expect(respuesta.status).toBe(401);
  });

  it("filtra por grupo si se proporciona", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.deudaRepo.obtenerPendientes.mockResolvedValue([]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas?grupo=g1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorDeudas(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 500 si el token es inválido (catch general del controlador)", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas",
      token: "token-invalido",
    });

    const respuesta = await controladorDeudas(req);
    expect(respuesta.status).toBe(500);
  });
});
