import bcrypt from "bcryptjs";
import { procesarLogin } from "@/auth/services/login.service";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

function crearMocks() {
  const usuarioRepo = {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmails: jest.fn(),
    buscarPorOauth: jest.fn(),
    crear: jest.fn(),
    actualizarContrasena: jest.fn(),
  };
  const sesionRepo = {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
    actualizarTokenHash: jest.fn(),
    eliminarPorTokenHash: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
  };
  return { usuarioRepo, sesionRepo };
}

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe("procesarLogin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retorna tokens y datos del usuario para credenciales válidas", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "user-1",
      nombre: "Juan",
      correo: "juan@test.com",
      contrasenaHash: "$2a$12$hashed",
      verificado: true,
    });
    bcryptMock.compare.mockResolvedValue(true as never);

    const resultado = await procesarLogin(
      "juan@test.com",
      "password123",
      usuarioRepo,
      sesionRepo,
    );

    expect(resultado).toHaveProperty("accessToken");
    expect(resultado).toHaveProperty("refreshToken");
    expect(resultado.usuario.nombre).toBe("Juan");
    expect(sesionRepo.crear).toHaveBeenCalled();
  });

  it("lanza error si el usuario no existe", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue(null);

    await expect(
      procesarLogin("no@existe.com", "pass123", usuarioRepo, sesionRepo),
    ).rejects.toThrow("Credenciales incorrectas");
  });

  it("lanza error si el usuario no tiene contrasenaHash (OAuth)", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "user-2",
      nombre: "Maria",
      correo: "maria@test.com",
      contrasenaHash: null,
      verificado: true,
    });

    await expect(
      procesarLogin("maria@test.com", "pass", usuarioRepo, sesionRepo),
    ).rejects.toThrow("Credenciales incorrectas");
  });

  it("lanza error si la contraseña es incorrecta", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "user-1",
      nombre: "Juan",
      correo: "juan@test.com",
      contrasenaHash: "$2a$12$hashed",
      verificado: true,
    });
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      procesarLogin("juan@test.com", "wrongpass", usuarioRepo, sesionRepo),
    ).rejects.toThrow("Credenciales incorrectas");
  });
});
