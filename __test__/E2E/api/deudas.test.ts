import {
  controladorDeudas,
  controladorObtenerDeuda,
  controladorPagarDeuda,
} from "@/deudas/controllers/deudas.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

const mockDeudaRepo = {
  crearMuchas: jest.fn(),
  obtenerPendientes: jest.fn(),
  obtenerTodasPorGrupo: jest.fn(),
  obtenerTodasPorGrupoIncluyendoSaldadas: jest.fn(),
  marcarComoSaldadas: jest.fn(),
  obtenerPorId: jest.fn(),
  actualizarEstado: jest.fn(),
};

jest.mock("@/shared/di/crearDependencias", () => ({
  crearDependencias: jest.fn(() => ({
    deudaRepo: mockDeudaRepo,
    invitacionRepo: {
      crear: jest.fn(),
      buscarPorToken: jest.fn(),
      buscarPorGrupo: jest.fn(),
      marcarComoUsada: jest.fn(),
      invalidarPorGrupoYCorreo: jest.fn(),
    },
    grupoRepo: {
      crear: jest.fn(),
      obtenerDetalle: jest.fn(),
      actualizarPresupuesto: jest.fn(),
      obtenerTodosActivos: jest.fn(),
    },
    miembroGrupoRepo: {
      buscarPorGrupo: jest.fn(),
      buscarPorUsuario: jest.fn(),
      crearMuchas: jest.fn(),
      buscarMiembrosDeGrupos: jest.fn(),
    },
    gastoRepo: {
      crear: jest.fn(),
      obtenerTodos: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorGrupo: jest.fn(),
    },
    notificacionRepo: {
      crear: jest.fn(),
      crearMuchas: jest.fn(),
    },
    usuarioRepo: {
      buscarPorCorreo: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmails: jest.fn(),
    },
    sesionRepo: {
      crear: jest.fn(),
      eliminarPorTokenHash: jest.fn(),
    },
    tokenRecuperacionRepo: {
      invalidarPorIdUsuario: jest.fn(),
    },
    db: { transaction: jest.fn((fn: any) => fn({})) },
  })),
}));

const tokens = generarTokens({
  idUsuario: "user-1",
  correo: "user1@test.com",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/deudas", () => {
  it("retorna 200 con deudas pendientes", async () => {
    mockDeudaRepo.obtenerPendientes.mockResolvedValue([
      { id: "d1", idDeudor: "user-1", idAcreedor: "user-2", monto: 100 },
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

  it("filtra por grupo si se proporciona parametro grupo", async () => {
    mockDeudaRepo.obtenerPendientes.mockResolvedValue([]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas?grupo=g1",
      token: tokens.accessToken,
    });

    await controladorDeudas(req);
    expect(mockDeudaRepo.obtenerPendientes).toHaveBeenCalledWith(
      "user-1",
      "g1",
    );
  });
});

describe("GET /api/deudas/[id]", () => {
  it("retorna 200 con detalle de deuda", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue({
      id: "d1",
      monto: 100,
      estado: "pendiente",
      saldada: false,
      actualizadoEn: new Date(),
      grupo: { id: "g1", nombre: "Grupo" },
      deudor: { id: "u1", nombre: "Deudor" },
      acreedor: { id: "u2", nombre: "Acreedor" },
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/d1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDeuda(req, { id: "d1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 404 si deuda no existe", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/no-existe",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerDeuda(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });
});

describe("POST /api/deudas/[id]/pagar", () => {
  it("retorna 200 al pagar deuda", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue({
      id: "d1",
      idDeudor: "user-1",
      idAcreedor: "user-2",
      monto: 100,
      saldada: false,
      estado: "pendiente",
      actualizadoEn: new Date(),
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/deudas/d1/pagar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorPagarDeuda(req, { id: "d1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/deudas/d1/pagar",
    });

    const respuesta = await controladorPagarDeuda(req, { id: "d1" });
    expect(respuesta.status).toBe(401);
  });

  it("retorna 404 si deuda no existe", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/deudas/no-existe/pagar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorPagarDeuda(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });

  it("retorna 403 si no es el deudor", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue({
      id: "d1",
      idDeudor: "user-2",
      idAcreedor: "user-1",
      estado: "pendiente",
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/deudas/d1/pagar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorPagarDeuda(req, { id: "d1" });
    expect(respuesta.status).toBe(403);
  });

  it("retorna 409 si la deuda ya esta pagada", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue({
      id: "d1",
      idDeudor: "user-1",
      estado: "pagada",
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/deudas/d1/pagar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorPagarDeuda(req, { id: "d1" });
    expect(respuesta.status).toBe(409);
  });
});
