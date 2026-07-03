import {
  controladorCrearInvitacion,
  controladorObtenerInvitaciones,
  controladorVerificarToken,
  controladorAceptarInvitacion,
} from "@/invitaciones/controllers/invitacion.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

const mockInvitacionRepo = {
  crear: jest.fn(),
  buscarPorToken: jest.fn(),
  buscarPorGrupo: jest.fn(),
  marcarComoUsada: jest.fn(),
  invalidarPorGrupoYCorreo: jest.fn(),
};

const mockGrupoRepo = {
  crear: jest.fn(),
  obtenerDetalle: jest.fn(),
  actualizarPresupuesto: jest.fn(),
  obtenerTodosActivos: jest.fn(),
};

const mockMiembroRepo = {
  buscarPorGrupo: jest.fn(),
  buscarPorUsuario: jest.fn(),
  crearMuchas: jest.fn(),
  buscarMiembrosDeGrupos: jest.fn(),
};

jest.mock("@/shared/di/crearDependencias", () => ({
  crearDependencias: jest.fn(() => ({
    invitacionRepo: mockInvitacionRepo,
    grupoRepo: mockGrupoRepo,
    miembroGrupoRepo: mockMiembroRepo,
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
  idUsuario: "admin-id",
  correo: "admin@test.com",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/grupos/[id]/invitaciones", () => {
  it("retorna 201 para invitacion valida", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [
        { idUsuario: "admin-id", rol: "admin" },
        { idUsuario: "user-2", rol: "miembro" },
      ],
    });
    mockInvitacionRepo.crear.mockResolvedValue({ id: "inv-1", token: "tok-1" });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
      cuerpo: { tipo: "enlace", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(201);
  });

  it("retorna 400 si tipo es invalido", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
      cuerpo: { tipo: "invalido", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(400);
  });

  it("retorna 400 si tipo correo sin correoInvitado", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
      cuerpo: { tipo: "correo", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(400);
  });

  it("retorna 400 si expiraHoras esta fuera de rango", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
      cuerpo: { tipo: "enlace", expiraHoras: 999 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      cuerpo: { tipo: "enlace", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no es admin", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [
        { idUsuario: "admin-id", rol: "admin" },
        { idUsuario: "user-2", rol: "miembro" },
      ],
    });

    const tokensUser = generarTokens({
      idUsuario: "user-2",
      correo: "user2@test.com",
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokensUser.accessToken,
      cuerpo: { tipo: "enlace", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(403);
  });

  it("retorna 404 si grupo no existe", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
      cuerpo: { tipo: "enlace", expiraHoras: 24 },
    });

    const respuesta = await controladorCrearInvitacion(req, { id: "g1" });
    expect(respuesta.status).toBe(404);
  });
});

describe("GET /api/grupos/[id]/invitaciones", () => {
  it("retorna 200 con invitaciones", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [
        { idUsuario: "admin-id", rol: "admin" },
        { idUsuario: "user-2", rol: "miembro" },
      ],
    });
    mockInvitacionRepo.buscarPorGrupo.mockResolvedValue([
      { id: "inv-1", token: "t1", estado: "pendiente" },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerInvitaciones(req, { id: "g1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/invitaciones",
    });

    const respuesta = await controladorObtenerInvitaciones(req, { id: "g1" });
    expect(respuesta.status).toBe(401);
  });
});

describe("GET /api/invitaciones/[token]", () => {
  it("retorna 200 para token valido", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      token: "tok-1",
      estado: "pendiente",
    });
    mockGrupoRepo.obtenerDetalle.mockResolvedValue({
      nombre: "Grupo Test",
      destino: "Chile",
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/invitaciones/tok-1",
    });

    const respuesta = await controladorVerificarToken(req, { token: "tok-1" });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 404 si token no existe", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/invitaciones/no-existe",
    });

    const respuesta = await controladorVerificarToken(req, {
      token: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });
});

describe("POST /api/invitaciones/[token]/aceptar", () => {
  it("retorna 200 al aceptar invitacion", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      estado: "pendiente",
    });
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "user-2" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/invitaciones/tok-1/aceptar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorAceptarInvitacion(req, {
      token: "tok-1",
    });
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/invitaciones/tok-1/aceptar",
    });

    const respuesta = await controladorAceptarInvitacion(req, {
      token: "tok-1",
    });
    expect(respuesta.status).toBe(401);
  });

  it("retorna 410 si invitacion expiro o fue utilizada", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      estado: "expirada",
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/invitaciones/tok-1/aceptar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorAceptarInvitacion(req, {
      token: "tok-1",
    });
    expect(respuesta.status).toBe(410);
  });

  it("retorna 409 si ya es miembro", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      estado: "pendiente",
    });
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "admin-id" },
    ]);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/invitaciones/tok-1/aceptar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorAceptarInvitacion(req, {
      token: "tok-1",
    });
    expect(respuesta.status).toBe(409);
  });

  it("retorna 404 si invitacion no existe", async () => {
    mockInvitacionRepo.buscarPorToken.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/invitaciones/no-existe/aceptar",
      token: tokens.accessToken,
    });

    const respuesta = await controladorAceptarInvitacion(req, {
      token: "no-existe",
    });
    expect(respuesta.status).toBe(404);
  });
});
