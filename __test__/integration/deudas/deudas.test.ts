import { obtenerDeudasPendientes } from '@/deudas/services/deudas.service';

function crearMockDeudaRepo() {
  return {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
  };
}

function crearDeuda(id: string, idDeudor: string, idAcreedor: string, monto: number, grupoId: string) {
  return {
    id, idDeudor, idAcreedor, monto,
    grupo: { id: grupoId, nombre: 'Grupo Test' },
    deudor: { id: idDeudor, nombre: 'Deudor', correo: 'deudor@test.com' },
    acreedor: { id: idAcreedor, nombre: 'Acreedor', correo: 'acreedor@test.com' },
    actualizadoEn: new Date(),
  } as any;
}

describe('obtenerDeudasPendientes', () => {
  it('separa deudas en debo_a y me_deben', async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([
      crearDeuda('d1', 'user-1', 'user-2', 100, 'g1'),
      crearDeuda('d2', 'user-2', 'user-1', 50, 'g1'),
      crearDeuda('d3', 'user-1', 'user-3', 75, 'g1'),
    ]);

    const resultado = await obtenerDeudasPendientes('user-1', deudaRepo);

    expect(resultado.debo_a).toHaveLength(2); // user-1 es deudor en d1 y d3
    expect(resultado.me_deben).toHaveLength(1); // user-1 es acreedor en d2
  });

  it('retorna arrays vacíos si no hay deudas', async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([]);

    const resultado = await obtenerDeudasPendientes('user-1', deudaRepo);

    expect(resultado.debo_a).toHaveLength(0);
    expect(resultado.me_deben).toHaveLength(0);
  });

  it('filtra por grupo si se proporciona idGrupo', async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([]);

    await obtenerDeudasPendientes('user-1', deudaRepo, 'g1');

    expect(deudaRepo.obtenerPendientes).toHaveBeenCalledWith('user-1', 'g1');
  });
});
