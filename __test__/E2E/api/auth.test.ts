import bcrypt from "bcryptjs";
import { controladorLogin } from "@/auth/controllers/login.controller";
import { controladorRegistro } from "@/auth/controllers/registro.controller";
import { controladorLogout } from "@/auth/controllers/logout.controller";
import { controladorRefresh } from "@/auth/controllers/refresh.controller";
import { controladorRecuperarContrasena } from "@/auth/controllers/recuperar.controller";
import { controladorNuevaContrasena } from "@/auth/controllers/nueva-contrasena.controller";
import { controladorBuscarUsuario } from "@/auth/controllers/usuarios.controller";
import { generarTokens } from "@/auth/services/jwt";
import { crearMockNextRequest } from "../helpers";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("@/shared/di/crearDependencias", () => {
  const mockUsuarioRepo = {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmails: jest.fn(),
    buscarPorOauth: jest.fn(),
    crear: jest.fn(),
    actualizarContrasena: jest.fn(),
  };
  const mockSesionRepo = {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
    actualizarTokenHash: jest.fn(),
    eliminarPorTokenHash: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
  };
  const mockTokenRecuperacionRepo = {
    invalidarPorIdUsuario: jest.fn(),
    crear: jest.fn(),
    buscarTokenValido: jest.fn(),
    marcarComoUsado: jest.fn(),
  };

  return {
    crearDependencias: jest.fn(() => ({
      usuarioRepo: mockUsuarioRepo,
      sesionRepo: mockSesionRepo,
      tokenRecuperacionRepo: mockTokenRecuperacionRepo,
      gastoRepo: {
        crear: jest.fn(),
        obtenerTodos: jest.fn(),
        obtenerPorId: jest.fn(),
      },
      grupoRepo: { crear: jest.fn(), obtenerDetalle: jest.fn() },
      deudaRepo: { crearMuchas: jest.fn(), obtenerPendientes: jest.fn() },
      divisionGastoRepo: { crearMuchas: jest.fn() },
      miembroGrupoRepo: {
        buscarPorGrupo: jest.fn(),
        crearMuchas: jest.fn(),
        buscarPorUsuario: jest.fn(),
        buscarMiembrosDeGrupos: jest.fn(),
      },
      db: { transaction: jest.fn((fn: any) => fn({})) },
    })),
  };
});

const tokens = generarTokens({
  idUsuario: "user-integration",
  correo: "user@test.com",
});
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("retorna 200 para credenciales válidas", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "user-1",
      nombre: "Juan",
      correo: "juan@test.com",
      contrasenaHash: "hash",
      verificado: true,
    });
    bcryptMock.compare.mockResolvedValue(true as never);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/login",
      cuerpo: { correo: "juan@test.com", contrasena: "password123" },
    });

    const respuesta = await controladorLogin(req);
    expect(respuesta.status).toBe(200);

    const body = await respuesta.json();
    expect(body.exito).toBe(true);
    expect(body.datos).toHaveProperty("accessToken");
  });

  it("retorna 400 para datos inválidos", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/login",
      cuerpo: { correo: "", contrasena: "" },
    });

    const respuesta = await controladorLogin(req);
    expect(respuesta.status).toBe(400);
  });

  it("retorna 401 para credenciales incorrectas", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorCorreo.mockResolvedValue(null);

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/login",
      cuerpo: { correo: "no@existe.com", contrasena: "password123" },
    });

    const respuesta = await controladorLogin(req);
    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/auth/registro", () => {
  it("retorna 201 para registro exitoso", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorCorreo.mockResolvedValue(null);
    deps.usuarioRepo.crear.mockResolvedValue({
      id: "new-user",
      nombre: "Nuevo",
      correo: "nuevo@test.com",
      contrasenaHash: "hash",
      verificado: false,
      creadoEn: new Date(),
    });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/registro",
      cuerpo: {
        nombre: "Nuevo",
        correo: "nuevo@test.com",
        contrasena: "password123",
        confirmarContrasena: "password123",
      },
    });

    const respuesta = await controladorRegistro(req);
    expect(respuesta.status).toBe(201);
  });

  it("retorna 400 para datos inválidos", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/registro",
      cuerpo: {
        nombre: "",
        correo: "",
        contrasena: "",
        confirmarContrasena: "",
      },
    });

    const respuesta = await controladorRegistro(req);
    expect(respuesta.status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  it("retorna 200 con refresh token válido", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.sesionRepo.buscarPorTokenHash.mockResolvedValue({
      id: "session-1",
      idUsuario: "user-1",
    });

    const { refreshToken } = tokens;
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/refresh",
      cookies: { refreshToken },
    });

    const respuesta = await controladorRefresh(req);
    expect(respuesta.status).toBe(200);
  });

  it("retorna 401 sin refresh token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/refresh",
    });

    const respuesta = await controladorRefresh(req);
    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("retorna 200 y cierra sesión", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/logout",
      cookies: { refreshToken: "some-token" },
    });

    const respuesta = await controladorLogout(req);
    expect(respuesta.status).toBe(200);
  });
});

describe("POST /api/auth/recuperar-contrasena", () => {
  it("retorna 200 para correo válido", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorCorreo.mockResolvedValue({ id: "user-1" });

    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/recuperar-contrasena",
      cuerpo: { correo: "usuario@test.com" },
    });

    const respuesta = await controladorRecuperarContrasena(req);
    expect(respuesta.status).toBe(200);
  });
});

describe("POST /api/auth/nueva-contrasena", () => {
  it("retorna 400 si falta token", async () => {
    const req = crearMockNextRequest({
      metodo: "POST",
      url: "http://localhost:3000/api/auth/nueva-contrasena",
      cuerpo: { contrasena: "nueva-pass" },
    });

    const respuesta = await controladorNuevaContrasena(req);
    expect(respuesta.status).toBe(400);
  });
});

describe("GET /api/auth/usuarios/buscar", () => {
  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/auth/usuarios/buscar?correo=test@test.com",
    });

    const respuesta = await controladorBuscarUsuario(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 200 con token válido", async () => {
    const { crearDependencias } = require("@/shared/di/crearDependencias");
    const deps = crearDependencias();
    deps.usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "user-1",
      nombre: "Encontrado",
      correo: "encontrado@test.com",
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/auth/usuarios/buscar?correo=encontrado@test.com",
      token: tokens.accessToken,
    });

    const respuesta = await controladorBuscarUsuario(req);
    expect(respuesta.status).toBe(200);
  });
});
