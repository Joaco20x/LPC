import { procesarLoginGoogle } from "@/auth/services/google.service";

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

const datosGoogle = {
  id: "google-123",
  email: "google@test.com",
  name: "Usuario Google",
  verified_email: true,
};

describe("procesarLoginGoogle", () => {
  it("crea usuario nuevo cuando no existe por OAuth ni correo", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorOauth.mockResolvedValue(null);
    usuarioRepo.buscarPorCorreo.mockResolvedValue(null);
    usuarioRepo.crear.mockResolvedValue({
      id: "new-user-id",
      nombre: "Usuario Google",
      correo: "google@test.com",
      verificado: true,
    });

    const resultado = await procesarLoginGoogle(
      datosGoogle,
      usuarioRepo,
      sesionRepo,
    );

    expect(usuarioRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Usuario Google",
        proveedorOauth: "google",
        idProveedorOauth: "google-123",
      }),
    );
    expect(resultado.accessToken).toBeDefined();
    expect(sesionRepo.crear).toHaveBeenCalled();
  });

  it("loguea usuario existente por OAuth", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorOauth.mockResolvedValue({
      id: "existing-oauth",
      nombre: "Usuario Google",
      correo: "google@test.com",
      verificado: true,
    });

    const resultado = await procesarLoginGoogle(
      datosGoogle,
      usuarioRepo,
      sesionRepo,
    );

    expect(usuarioRepo.crear).not.toHaveBeenCalled();
    expect(resultado.usuario.id).toBe("existing-oauth");
  });

  it("vincula cuenta OAuth a usuario existente por correo", async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorOauth.mockResolvedValue(null);
    usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: "existing-email",
      nombre: "Existente",
      correo: "google@test.com",
      verificado: true,
    });

    const resultado = await procesarLoginGoogle(
      datosGoogle,
      usuarioRepo,
      sesionRepo,
    );

    expect(usuarioRepo.crear).not.toHaveBeenCalled();
    expect(resultado.usuario.id).toBe("existing-email");
  });
});
