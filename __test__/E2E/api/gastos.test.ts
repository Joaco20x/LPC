import { controladorCrearGasto, controladorObtenerGastos, controladorObtenerOpciones } from '@/gastos/controllers/gasto.controller';
import { generarTokens } from '@/auth/services/jwt';
import { crearMockNextRequest } from '../helpers';

jest.mock('@/shared/di/crearDependencias', () => {
  const mockGastoRepo = { crear: jest.fn(), obtenerTodos: jest.fn(), obtenerPorId: jest.fn() };
  const mockDivisionRepo = { crearMuchas: jest.fn() };
  const mockDeudaRepo = { crearMuchas: jest.fn(), obtenerPendientes: jest.fn() };
  const mockMiembroRepo = {
    buscarPorGrupo: jest.fn(), crearMuchas: jest.fn(),
    buscarPorUsuario: jest.fn(), buscarMiembrosDeGrupos: jest.fn(),
  };

  return {
    crearDependencias: jest.fn(() => ({
      gastoRepo: mockGastoRepo,
      divisionGastoRepo: mockDivisionRepo,
      deudaRepo: mockDeudaRepo,
      miembroGrupoRepo: mockMiembroRepo,
      usuarioRepo: {
        buscarPorCorreo: jest.fn(), buscarPorId: jest.fn(),
        buscarPorEmails: jest.fn(), buscarPorOauth: jest.fn(),
        crear: jest.fn(), actualizarContrasena: jest.fn(),
      },
      sesionRepo: { crear: jest.fn(), buscarPorTokenHash: jest.fn(), actualizarTokenHash: jest.fn(), eliminarPorTokenHash: jest.fn(), eliminarPorIdUsuario: jest.fn() },
      grupoRepo: { crear: jest.fn(), obtenerDetalle: jest.fn() },
      tokenRecuperacionRepo: { invalidarPorIdUsuario: jest.fn(), crear: jest.fn(), buscarTokenValido: jest.fn(), marcarComoUsado: jest.fn() },
      db: { transaction: jest.fn((fn: any) => fn({})) },
    })),
  };
});

jest.mock('@/shared/libs/prismaDatabaseService', () => ({
  PrismaDatabaseService: { transaction: jest.fn((fn: any) => fn({})) },
}));

const tokens = generarTokens({ idUsuario: 'user-test', correo: 'test@test.com' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/gastos', () => {
  it('retorna 201 para gasto válido', async () => {
    const { crearDependencias } = require('@/shared/di/crearDependencias');
    const deps = crearDependencias();
    deps.gastoRepo.crear.mockResolvedValue({ id: 'gasto-1' });
    deps.gastoRepo.obtenerPorId.mockResolvedValue({ id: 'gasto-1', monto: 100 });
    deps.miembroGrupoRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: 'user-test' }, { idUsuario: 'user-2' },
    ]);

    const req = crearMockNextRequest({
      metodo: 'POST', url: 'http://localhost:3000/api/gastos',
      token: tokens.accessToken,
      cuerpo: { idGrupo: 'g1', monto: 100, descripcion: 'Cena', categoria: 'Comida', divisiones: [{ idUsuario: 'user-test', montoAsignado: 100, tipoDivision: 'exacto' }] },
    });

    const respuesta = await controladorCrearGasto(req);
    expect(respuesta.status).toBe(201);
  });

  it('retorna 400 para datos inválidos', async () => {
    const req = crearMockNextRequest({
      metodo: 'POST', url: 'http://localhost:3000/api/gastos',
      token: tokens.accessToken,
      cuerpo: { idGrupo: '' },
    });

    const respuesta = await controladorCrearGasto(req);
    expect(respuesta.status).toBe(400);
  });

  it('retorna 401 sin token', async () => {
    const req = crearMockNextRequest({
      metodo: 'POST', url: 'http://localhost:3000/api/gastos',
      cuerpo: { idGrupo: 'g1', monto: 100 },
    });

    const respuesta = await controladorCrearGasto(req);
    expect(respuesta.status).toBe(401);
  });
});

describe('GET /api/gastos', () => {
  it('retorna 200 con gastos', async () => {
    const { crearDependencias } = require('@/shared/di/crearDependencias');
    const deps = crearDependencias();
    deps.gastoRepo.obtenerTodos.mockResolvedValue([{ id: 'g1', monto: 100 }]);

    const req = crearMockNextRequest({
      url: 'http://localhost:3000/api/gastos',
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerGastos(req);
    expect(respuesta.status).toBe(200);
  });

  it('retorna 401 sin token', async () => {
    const req = crearMockNextRequest({ url: 'http://localhost:3000/api/gastos' });
    const respuesta = await controladorObtenerGastos(req);
    expect(respuesta.status).toBe(401);
  });
});

describe('GET /api/gastos/opciones', () => {
  it('retorna 200 con opciones del formulario', async () => {
    const { crearDependencias } = require('@/shared/di/crearDependencias');
    const deps = crearDependencias();
    deps.miembroGrupoRepo.buscarPorUsuario.mockResolvedValue([
      { grupo: { id: 'g1', nombre: 'Grupo 1', _count: { miembros: 2 } } } as any,
    ]);
    deps.miembroGrupoRepo.buscarMiembrosDeGrupos.mockResolvedValue([
      { idUsuario: 'u1', usuario: { id: 'u1', nombre: 'User 1' } } as any,
    ]);

    const req = crearMockNextRequest({
      url: 'http://localhost:3000/api/gastos/opciones',
      token: tokens.accessToken,
    });

    const respuesta = await controladorObtenerOpciones(req);
    expect(respuesta.status).toBe(200);
  });
});
