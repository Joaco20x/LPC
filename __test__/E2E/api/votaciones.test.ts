import {
  controladorCrearVotacion,
  controladorObtenerVotaciones,
  controladorObtenerVotacion,
  controladorEmitirVoto,
} from "@/votaciones/controllers/votacion.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

const mockVotacionRepo = {
  crear: jest.fn(),
  buscarPorId: jest.fn(),
  buscarPorGrupo: jest.fn(),
  buscarPorDeuda: jest.fn(),
  registrarVoto: jest.fn(),
  resolver: jest.fn(),
};

const mockMiembroRepo = {
  buscarPorGrupo: jest.fn(),
  buscarPorUsuario: jest.fn(),
  crearMuchas: jest.fn(),
  buscarMiembrosDeGrupos: jest.fn(),
};

jest.mock("@/shared/di/crearDependencias", () => ({
  crearDependencias: jest.fn(() => ({
    votacionRepo: mockVotacionRepo,
    miembroGrupoRepo: mockMiembroRepo,
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
    gastoRepo: {
      crear: jest.fn(),
      obtenerTodos: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorGrupo: jest.fn(),
    },
    deudaRepo: {
      crearMuchas: jest.fn(),
      obtenerPendientes: jest.fn(),
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

describe("POST /api/votaciones", () => {
  it("retorna 201 para votacion valida", async () => {
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);
    mockVotacionRepo.buscarPorDeuda.mockResolvedValue(null);
    mockVotacionRepo.crear.mockResolvedValue({ id: "v1" });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
      cuerpo: { idGrupo: "g1", idDeuda: "d1", tipo: "abstencion" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(201);
  });

  it("retorna 400 si falta idGrupo", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
      cuerpo: { idDeuda: "d1", tipo: "abstencion" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(400);
  });

  it("retorna 400 si tipo es invalido", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
      cuerpo: { idGrupo: "g1", idDeuda: "d1", tipo: "invalido" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      cuerpo: { idGrupo: "g1", idDeuda: "d1", tipo: "abstencion" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no es miembro del grupo", async () => {
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-2" },
      { idUsuario: "user-3" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
      cuerpo: { idGrupo: "g1", idDeuda: "d1", tipo: "abstencion" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(403);
  });

  it("retorna 409 si ya existe votacion activa", async () => {
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);
    mockVotacionRepo.buscarPorDeuda.mockResolvedValue({ id: "v1" });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
      cuerpo: { idGrupo: "g1", idDeuda: "d1", tipo: "abstencion" },
    });

    const respuesta = await controladorCrearVotacion(req);
    expect(respuesta.status).toBe(409);
  });
});

describe("GET /api/votaciones", () => {
  it("retorna 200 con votaciones", async () => {
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);
    mockVotacionRepo.buscarPorGrupo.mockResolvedValue([
      { id: "v1", estado: "activa" },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones?idGrupo=g1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerVotaciones(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 400 si falta idGrupo", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerVotaciones(req);
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones?idGrupo=g1",
    });

    const respuesta = await controladorObtenerVotaciones(req);
    expect(respuesta.status).toBe(401);
  });
});

describe("GET /api/votaciones/[id]", () => {
  it("retorna 200 con votacion", async () => {
    mockVotacionRepo.buscarPorId.mockResolvedValue({
      id: "v1",
      idGrupo: "g1",
      estado: "activa",
    });
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones/v1",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerVotacion(req, { id: "v1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 404 si votacion no existe", async () => {
    mockVotacionRepo.buscarPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones/no-existe",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerVotacion(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/votaciones/v1",
    });

    const respuesta = await controladorObtenerVotacion(req, { id: "v1" });
    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/votaciones/[id]/votar", () => {
  function crearVotacionDetalle(overrides: Record<string, unknown> = {}) {
    return {
      id: "v1",
      idGrupo: "g1",
      idDeuda: "d1",
      idCreador: "user-1",
      tipo: "abstencion",
      estado: "activa",
      resultado: null,
      creadoEn: new Date(),
      resueltaEn: null,
      totalMiembros: 2,
      aprobaciones: 0,
      rechazos: 0,
      pendientes: 2,
      votos: [],
      ...overrides,
    };
  }

  it("retorna 200 al emitir voto", async () => {
    mockVotacionRepo.buscarPorId
      .mockResolvedValueOnce(crearVotacionDetalle())
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          votos: [{ idUsuario: "user-1", decision: "aprobar" }],
          aprobaciones: 1,
          pendientes: 1,
        }),
      );
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 400 si decision es invalida", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "invalida" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(401);
  });

  it("retorna 404 si votacion no existe", async () => {
    mockVotacionRepo.buscarPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/no-existe/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, {
      id: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });

  it("retorna 409 si votacion ya fue resuelta", async () => {
    mockVotacionRepo.buscarPorId.mockResolvedValue(
      crearVotacionDetalle({ estado: "resuelta" }),
    );

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(409);
  });

  it("retorna 409 si el usuario ya voto", async () => {
    mockVotacionRepo.buscarPorId.mockResolvedValue(
      crearVotacionDetalle({
        votos: [{ idUsuario: "user-1", decision: "aprobar" }],
      }),
    );

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(409);
  });

  it("retorna 200 con mensaje de resolucion si se alcanza mayoria", async () => {
    mockVotacionRepo.buscarPorId
      .mockResolvedValueOnce(crearVotacionDetalle())
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          votos: [
            { idUsuario: "user-1", decision: "aprobar" },
            { idUsuario: "user-2", decision: "aprobar" },
          ],
          aprobaciones: 2,
          pendientes: 0,
        }),
      )
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          estado: "resuelta",
          resultado: "aprobada",
          aprobaciones: 2,
        }),
      );
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/votaciones/v1/votar",
      token: tokens.accessToken,
      cuerpo: { decision: "aprobar" },
    });

    const respuesta = await controladorEmitirVoto(req, { id: "v1" });
    expect(respuesta.status).toBe(200);
  });
});
