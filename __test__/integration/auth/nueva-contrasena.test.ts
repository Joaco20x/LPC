import { cambiarContrasenaConToken } from '@/auth/services/nueva-contrasena.service';

function crearMocks() {
  const tokenRepo = {
    invalidarPorIdUsuario: jest.fn(),
    crear: jest.fn(),
    buscarTokenValido: jest.fn(),
    marcarComoUsado: jest.fn(),
  };
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
  return { tokenRepo, usuarioRepo, sesionRepo };
}

describe('cambiarContrasenaConToken', () => {
  it('actualiza contraseña, marca token usado y limpia sesiones', async () => {
    const { tokenRepo, usuarioRepo, sesionRepo } = crearMocks();
    tokenRepo.buscarTokenValido.mockResolvedValue({
      id: 'token-1', idUsuario: 'user-1',
    });

    await cambiarContrasenaConToken('token-valido', 'nueva-pass-123', tokenRepo, usuarioRepo, sesionRepo);

    expect(usuarioRepo.actualizarContrasena).toHaveBeenCalledWith('user-1', expect.any(String));
    expect(tokenRepo.marcarComoUsado).toHaveBeenCalledWith('token-1');
    expect(sesionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith('user-1');
  });

  it('lanza error si el token es inválido', async () => {
    const { tokenRepo, usuarioRepo, sesionRepo } = crearMocks();
    tokenRepo.buscarTokenValido.mockResolvedValue(null);

    await expect(cambiarContrasenaConToken('token-invalido', 'nueva-pass', tokenRepo, usuarioRepo, sesionRepo))
      .rejects.toThrow('Token inválido o expirado');
  });
});
