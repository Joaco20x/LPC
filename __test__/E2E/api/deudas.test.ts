import { controladorDeudas } from "@/deudas/controllers/deudas.controller";
import { controladorSaldarTransferencia } from "@/deudas/controllers/optimizacion.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

jest.mock("@/shared/di/crearDependencias", () => {
  const mockDeudaRepo = {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerTodasPorGrupo: jest.fn(),
    marcarComoSaldadas: jest.fn(),
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

  it("incluye deudas donde el usuario es acreedor", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.deudaRepo.obtenerPendientes.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "user-2",
        idAcreedor: "user-test",
        monto: 50,
        grupo: { id: "g1", nombre: "Grupo Test" },
        deudor: { id: "user-2", nombre: "Otro", correo: "otro@test.com" },
        acreedor: { id: "user-test", nombre: "Yo", correo: "yo@test.com" },
        actualizadoEn: new Date(),
      },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas",
      token: tokens.accessToken,
    });

    const respuesta = await controladorDeudas(req);
    const body = await respuesta.json();
    expect(respuesta.status).toBe(200);
    expect(body.datos.me_deben).toHaveLength(1);
  });
});

describe("POST /api/grupos/[id]/deudas (saldar transferencia)", () => {
  it("retorna 200 al saldar una transferencia", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/deudas",
      token: tokens.accessToken,
      cuerpo: { idDeudor: "user-2", idAcreedor: "user-test", monto: 100 },
    });

    const respuesta = await controladorSaldarTransferencia(req, "g1");
    expect(respuesta.status).toBe(200);
    expect(deps.deudaRepo.marcarComoSaldadas).toHaveBeenCalledWith(
      "g1",
      "user-2",
      "user-test",
    );
    expect(deps.deudaRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("retorna 400 si faltan datos", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/deudas",
      token: tokens.accessToken,
      cuerpo: {},
    });

    const respuesta = await controladorSaldarTransferencia(req, "g1");
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/deudas",
    });

    const respuesta = await controladorSaldarTransferencia(req, "g1");
    expect(respuesta.status).toBe(401);
  });
});
