import { iniciarRecuperacion } from '@/auth/services/recuperar.service';

function crearMocks() {
  const usuarioRepo = {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmails: jest.fn(),
    buscarPorOauth: jest.fn(),
    crear: jest.fn(),
    actualizarContrasena: jest.fn(),
  };
  const tokenRepo = {
    invalidarPorIdUsuario: jest.fn(),
    crear: jest.fn(),
    buscarTokenValido: jest.fn(),
    marcarComoUsado: jest.fn(),
  };
  return { usuarioRepo, tokenRepo };
}

describe('iniciarRecuperacion', () => {
  it('genera token de recuperación para usuario existente', async () => {
    const { usuarioRepo, tokenRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue({ id: 'user-1' });

    await iniciarRecuperacion('usuario@test.com', usuarioRepo, tokenRepo);

    expect(tokenRepo.invalidarPorIdUsuario).toHaveBeenCalledWith('user-1');
    expect(tokenRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: 'user-1' }),
    );
  });

  it('no hace nada si el correo no existe (retorno silencioso)', async () => {
    const { usuarioRepo, tokenRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue(null);

    await iniciarRecuperacion('no-existe@test.com', usuarioRepo, tokenRepo);

    expect(tokenRepo.invalidarPorIdUsuario).not.toHaveBeenCalled();
    expect(tokenRepo.crear).not.toHaveBeenCalled();
  });
});
