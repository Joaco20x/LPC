import { registrarGasto, obtenerGastos, obtenerOpcionesFormulario } from '@/gastos/services/gasto.service';

function crearMocks() {
  const gastoRepo = { crear: jest.fn(), obtenerTodos: jest.fn(), obtenerPorId: jest.fn() };
  const divisionRepo = { crearMuchas: jest.fn() };
  const deudaRepo = { crearMuchas: jest.fn(), obtenerPendientes: jest.fn() };
  const miembroRepo = {
    buscarPorGrupo: jest.fn(),
    crearMuchas: jest.fn(),
    buscarPorUsuario: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
  const db = { transaction: jest.fn((fn: any) => fn({})) };
  return { gastoRepo, divisionRepo, deudaRepo, miembroRepo, db };
}

describe('registrarGasto', () => {
  it('crea un gasto con divisiones y genera deudas', async () => {
    const { gastoRepo, divisionRepo, deudaRepo, miembroRepo, db } = crearMocks();
    gastoRepo.crear.mockResolvedValue({ id: 'gasto-1' });
    gastoRepo.obtenerPorId.mockResolvedValue({ id: 'gasto-1', monto: 300 });
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: 'u1' }, { idUsuario: 'u2' }, { idUsuario: 'u3' },
    ]);

    await registrarGasto(
      { idGrupo: 'g1', idPagador: 'u1', monto: 300, divisiones: [{ idUsuario: 'u1', montoAsignado: 150, tipoDivision: 'exacto' }, { idUsuario: 'u2', montoAsignado: 150, tipoDivision: 'exacto' }] },
      gastoRepo, divisionRepo, deudaRepo, miembroRepo, db,
    );

    expect(gastoRepo.crear).toHaveBeenCalled();
    expect(divisionRepo.crearMuchas).toHaveBeenCalled();
    expect(deudaRepo.crearMuchas).toHaveBeenCalled();
  });

  it('lanza error si falta idGrupo o idPagador', async () => {
    const { gastoRepo, divisionRepo, deudaRepo, miembroRepo, db } = crearMocks();

    await expect(registrarGasto(
      { monto: 100 },
      gastoRepo, divisionRepo, deudaRepo, miembroRepo, db,
    )).rejects.toThrow('Faltan identificadores requeridos');
  });
});

describe('obtenerGastos', () => {
  it('retorna todos los gastos', async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerTodos.mockResolvedValue([{ id: 'g1', monto: 100 }]);

    const gastos = await obtenerGastos(gastoRepo);
    expect(gastos).toHaveLength(1);
  });
});

describe('obtenerOpcionesFormulario', () => {
  it('retorna grupos y miembros únicos del usuario', async () => {
    const { miembroRepo } = crearMocks();
    miembroRepo.buscarPorUsuario.mockResolvedValue([
      { grupo: { id: 'g1', nombre: 'Grupo 1' } } as any,
    ]);
    miembroRepo.buscarMiembrosDeGrupos.mockResolvedValue([
      { idUsuario: 'u1', usuario: { id: 'u1', nombre: 'Usuario 1' } } as any,
      { idUsuario: 'u2', usuario: { id: 'u2', nombre: 'Usuario 2' } } as any,
      { idUsuario: 'u1', usuario: { id: 'u1', nombre: 'Usuario 1' } } as any,
    ]);

    const opciones = await obtenerOpcionesFormulario('user-1', miembroRepo);

    expect(opciones.grupos).toHaveLength(1);
    expect(opciones.miembros).toHaveLength(2); // u1 y u2, sin duplicados
  });
});
