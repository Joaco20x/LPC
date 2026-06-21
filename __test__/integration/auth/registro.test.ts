import { crearNuevoUsuario } from '@/auth/services/registro.service';

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

describe('crearNuevoUsuario', () => {
  it('crea un usuario y retorna tokens', async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue(null);
    usuarioRepo.crear.mockResolvedValue({
      id: 'new-user-id', nombre: 'Ana', correo: 'ana@test.com',
      contrasenaHash: 'hash', verificado: false, creadoEn: new Date(),
    });

    const resultado = await crearNuevoUsuario(
      { nombre: 'Ana', correo: 'ana@test.com', contrasena: 'password123' },
      usuarioRepo, sesionRepo,
    );

    expect(resultado.accessToken).toBeDefined();
    expect(resultado.usuario.nombre).toBe('Ana');
    expect(usuarioRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'ana@test.com', nombre: 'Ana' }),
    );
    expect(sesionRepo.crear).toHaveBeenCalled();
  });

  it('lanza error si el correo ya está registrado', async () => {
    const { usuarioRepo, sesionRepo } = crearMocks();
    usuarioRepo.buscarPorCorreo.mockResolvedValue({
      id: 'existing-id', nombre: 'Existente', correo: 'ya@registrado.com',
      contrasenaHash: 'hash', verificado: true,
    });

    await expect(crearNuevoUsuario(
      { nombre: 'Nuevo', correo: 'ya@registrado.com', contrasena: 'pass123' },
      usuarioRepo, sesionRepo,
    )).rejects.toThrow('Este correo ya está registrado');
  });
});
