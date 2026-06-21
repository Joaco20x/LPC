import { terminarSesion } from '@/auth/services/logout.service';

function crearMockSesionRepo() {
  return {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
    actualizarTokenHash: jest.fn(),
    eliminarPorTokenHash: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
  };
}

describe('terminarSesion', () => {
  it('elimina la sesión por token hash', async () => {
    const sesionRepo = crearMockSesionRepo();

    await terminarSesion('token-hash-ejemplo', sesionRepo);

    expect(sesionRepo.eliminarPorTokenHash).toHaveBeenCalledWith('token-hash-ejemplo');
  });
});
