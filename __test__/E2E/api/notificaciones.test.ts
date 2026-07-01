import {
  controladorObtenerNotificaciones,
  controladorMarcarTodasLeidas,
  controladorMarcarUnaLeida,
} from "@/notificaciones/controllers/notificacion.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

const mockNotificacionRepo = {
  obtenerPorUsuario: jest.fn(),
  contarNoLeidas: jest.fn(),
  marcarLeida: jest.fn(),
  marcarTodasLeidas: jest.fn(),
  crear: jest.fn(),
  crearMuchas: jest.fn(),
};

jest.mock("@/shared/di/crearDependencias", () => ({
  crearDependencias: jest.fn(() => ({
    notificacionRepo: mockNotificacionRepo,
  })),
}));

jest.mock("@/shared/libs/prismaDatabaseService", () => ({
  PrismaDatabaseService: { transaction: jest.fn((fn: any) => fn({})) },
}));

const tokens = generarTokens({
  idUsuario: "user-test",
  correo: "test@test.com",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/notificaciones", () => {
  it("retorna 200 con lista de notificaciones", async () => {
    mockNotificacionRepo.obtenerPorUsuario.mockResolvedValue([
      { id: "n1", tipo: "nuevo_gasto", leida: false },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/notificaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerNotificaciones(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/notificaciones",
    });

    const respuesta = await controladorObtenerNotificaciones(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 500 si falla al obtener notificaciones", async () => {
    mockNotificacionRepo.obtenerPorUsuario.mockRejectedValue(
      new Error("Error de BD"),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/notificaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerNotificaciones(req);
    expect(respuesta.status).toBe(500);
  });
});

describe("PATCH /api/notificaciones (marcar todas leidas)", () => {
  it("retorna 200 al marcar todas como leidas", async () => {
    mockNotificacionRepo.marcarTodasLeidas.mockResolvedValue(undefined);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/notificaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorMarcarTodasLeidas(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/notificaciones",
    });

    const respuesta = await controladorMarcarTodasLeidas(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 500 si falla al marcar todas como leidas", async () => {
    mockNotificacionRepo.marcarTodasLeidas.mockRejectedValue(
      new Error("Error de BD"),
    );

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/notificaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorMarcarTodasLeidas(req);
    expect(respuesta.status).toBe(500);
  });
});

describe("PATCH /api/notificaciones/[id]", () => {
  const idNotificacion = "n1";

  it("retorna 200 al marcar una como leida", async () => {
    mockNotificacionRepo.marcarLeida.mockResolvedValue(undefined);

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: `http://localhost:3000/api/notificaciones/${idNotificacion}`,
      token: tokens.accessToken,
    });

    const respuesta = await controladorMarcarUnaLeida(req, idNotificacion);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: `http://localhost:3000/api/notificaciones/${idNotificacion}`,
    });

    const respuesta = await controladorMarcarUnaLeida(req, idNotificacion);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 500 si falla al marcar como leida", async () => {
    mockNotificacionRepo.marcarLeida.mockRejectedValue(
      new Error("Error de BD"),
    );

    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: `http://localhost:3000/api/notificaciones/${idNotificacion}`,
      token: tokens.accessToken,
    });

    const respuesta = await controladorMarcarUnaLeida(req, idNotificacion);
    expect(respuesta.status).toBe(500);
  });
});

describe("controladores con token invalido", () => {
  it("retorna 401 con token malformado en obtenerNotificaciones", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/notificaciones",
      token: "token-invalido",
    });

    const respuesta = await controladorObtenerNotificaciones(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 401 con token malformado en marcarTodasLeidas", async () => {
    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/notificaciones",
      token: "token-invalido",
    });

    const respuesta = await controladorMarcarTodasLeidas(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 401 con token malformado en marcarUnaLeida", async () => {
    const req = crearMockNextRequest({
      metodo: "PATCH",
      url: "http://localhost:3000/api/notificaciones/n1",
      token: "token-invalido",
    });

    const respuesta = await controladorMarcarUnaLeida(req, "n1");
    expect(respuesta.status).toBe(401);
  });
});
