import {
  generarTokens,
  verificarAccessToken,
  verificarRefreshToken,
} from "@/auth/services/jwt";

describe("generarTokens", () => {
  const payload = { idUsuario: "user-1", correo: "test@test.com" };

  it("retorna accessToken y refreshToken", () => {
    const tokens = generarTokens(payload);
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
    expect(typeof tokens.accessToken).toBe("string");
    expect(typeof tokens.refreshToken).toBe("string");
  });

  it("genera tokens distintos", () => {
    const tokens = generarTokens(payload);
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });
});

describe("verificarAccessToken", () => {
  const payload = { idUsuario: "user-1", correo: "test@test.com" };

  it("retorna el payload para un token válido", () => {
    const { accessToken } = generarTokens(payload);
    const resultado = verificarAccessToken(accessToken);
    expect(resultado.idUsuario).toBe("user-1");
    expect(resultado.correo).toBe("test@test.com");
  });

  it("lanza error para token inválido", () => {
    expect(() => verificarAccessToken("token-invalido")).toThrow();
  });
});

describe("verificarRefreshToken", () => {
  const payload = { idUsuario: "user-1", correo: "test@test.com" };

  it("retorna el payload para un refresh token válido", () => {
    const { refreshToken } = generarTokens(payload);
    const resultado = verificarRefreshToken(refreshToken);
    expect(resultado.idUsuario).toBe("user-1");
  });

  it("lanza error para token inválido", () => {
    expect(() => verificarRefreshToken("token-invalido")).toThrow();
  });
});
