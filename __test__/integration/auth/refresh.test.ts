import { refrescarToken } from "@/auth/services/refresh.service";
import { generarTokens } from "@/auth/services/jwt";

function crearMockSesionRepo() {
  return {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
    actualizarTokenHash: jest.fn(),
    eliminarPorTokenHash: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
  };
}

describe("refrescarToken", () => {
  it("rota el token cuando el refresh es válido", async () => {
    const sesionRepo = crearMockSesionRepo();
    const payload = { idUsuario: "user-1", correo: "test@test.com" };
    const { refreshToken } = generarTokens(payload);

    sesionRepo.buscarPorTokenHash.mockResolvedValue({
      id: "session-1",
      idUsuario: "user-1",
    });

    const resultado = await refrescarToken(refreshToken, sesionRepo);

    expect(resultado).toHaveProperty("accessToken");
    expect(resultado).toHaveProperty("refreshToken");
    expect(sesionRepo.actualizarTokenHash).toHaveBeenCalled();
  });

  it("lanza error si la sesión no existe en BD", async () => {
    const sesionRepo = crearMockSesionRepo();
    const payload = { idUsuario: "user-1", correo: "test@test.com" };
    const { refreshToken } = generarTokens(payload);

    sesionRepo.buscarPorTokenHash.mockResolvedValue(null);

    await expect(refrescarToken(refreshToken, sesionRepo)).rejects.toThrow(
      "Sesión inválida o expirada",
    );
  });

  it("lanza error para un token inválido", async () => {
    const sesionRepo = crearMockSesionRepo();
    await expect(
      refrescarToken("token-invalido", sesionRepo),
    ).rejects.toThrow();
  });
});
