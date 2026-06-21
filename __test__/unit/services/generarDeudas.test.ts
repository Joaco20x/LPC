import { generarDeudas } from '@/deudas/services/generarDeudas.service';

function crearMockMiembroRepo(miembros: { idUsuario: string }[]) {
  return { buscarPorGrupo: jest.fn().mockResolvedValue(miembros) };
}

function crearMockDeudaRepo() {
  return { crearMuchas: jest.fn().mockResolvedValue(undefined) };
}

describe('generarDeudas', () => {
  it('genera deudas para miembros que no están en divisiones', async () => {
    const miembroRepo = crearMockMiembroRepo([
      { idUsuario: 'u1' }, { idUsuario: 'u2' }, { idUsuario: 'u3' },
    ]);
    const deudaRepo = crearMockDeudaRepo();

    await generarDeudas(
      { idGrupo: 'g1', monto: 300, divisiones: [{ idUsuario: 'u1' }, { idUsuario: 'u2' }] },
      miembroRepo, deudaRepo, {} as any,
    );

    expect(deudaRepo.crearMuchas).toHaveBeenCalled();
    const deudasCreadas = deudaRepo.crearMuchas.mock.calls[0][0];
    // u3 debe a u1 y u2
    expect(deudasCreadas).toHaveLength(2);
    expect(deudasCreadas[0].idDeudor).toBe('u3');
    expect(deudasCreadas[0].saldada).toBe(false);
  });

  it('no genera deudas si todos los miembros están en divisiones', async () => {
    const miembroRepo = crearMockMiembroRepo([
      { idUsuario: 'u1' }, { idUsuario: 'u2' },
    ]);
    const deudaRepo = crearMockDeudaRepo();

    await generarDeudas(
      { idGrupo: 'g1', monto: 200, divisiones: [{ idUsuario: 'u1' }, { idUsuario: 'u2' }] },
      miembroRepo, deudaRepo, {} as any,
    );

    expect(deudaRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it('no genera deudas si el grupo tiene un solo miembro', async () => {
    const miembroRepo = crearMockMiembroRepo([{ idUsuario: 'u1' }]);
    const deudaRepo = crearMockDeudaRepo();

    await generarDeudas(
      { idGrupo: 'g1', monto: 100, divisiones: [{ idUsuario: 'u1' }] },
      miembroRepo, deudaRepo, {} as any,
    );

    expect(deudaRepo.crearMuchas).not.toHaveBeenCalled();
  });
});
