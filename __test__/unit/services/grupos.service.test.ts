jest.mock("@/shared/servicios/convertirMoneda", () => ({
  crearConversorMoneda: jest.fn(),
}));

import { crearConversorMoneda } from "@/shared/servicios/convertirMoneda";
import { obtenerDetalleGrupo } from "@/grupos/services/grupos.service";

const mockCrearConversorMoneda = crearConversorMoneda as jest.Mock;

function crearMockGrupoRepo() {
  return {
    crear: jest.fn(),
    obtenerDetalle: jest.fn(),
    actualizarPresupuesto: jest.fn(),
    obtenerTodosActivos: jest.fn(),
  };
}

function crearMockDeudaRepo() {
  return {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerTodasPorGrupo: jest.fn(),
    obtenerTodasPorGrupoIncluyendoSaldadas: jest.fn(),
    marcarComoSaldadas: jest.fn(),
    obtenerPorId: jest.fn(),
    actualizarEstado: jest.fn(),
  };
}

function crearGrupoDetalle(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    nombre: "Grupo Test",
    destino: "Chile",
    fechaInicio: new Date(),
    fechaFin: new Date(),
    monedaBase: "CLP",
    presupuestoPorPersona: null,
    umbralAlerta: null,
    estado: "activo",
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    miembros: [],
    gastos: [],
    _count: { miembros: 2 },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("obtenerDetalleGrupo", () => {
  it("retorna grupo con totalEnBase calculado y acumulado vacio sin gastos", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle());
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    mockCrearConversorMoneda.mockResolvedValue({});

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.totalEnBase).toBe(0);
    expect(result.acumuladoPorUsuario).toEqual({});
  });

  it("calcula totalEnBase sumando montos de gastos", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(
      crearGrupoDetalle({
        gastos: [
          { monto: 100, moneda: "CLP", divisiones: [] },
          { monto: 200, moneda: "CLP", divisiones: [] },
        ],
      }),
    );
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    mockCrearConversorMoneda.mockResolvedValue({});

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.totalEnBase).toBe(300);
  });

  it("convierte montos de gastos a moneda base", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(
      crearGrupoDetalle({
        gastos: [{ monto: 10, moneda: "USD", divisiones: [] }],
      }),
    );
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    mockCrearConversorMoneda.mockResolvedValue({ USD: 900 });

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.totalEnBase).toBe(9000);
  });

  it("acumula montos de divisiones por usuario", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(
      crearGrupoDetalle({
        gastos: [
          {
            monto: 100,
            moneda: "CLP",
            divisiones: [
              { idUsuario: "u1", montoAsignado: 60, moneda: "CLP" },
              { idUsuario: "u2", montoAsignado: 40, moneda: "CLP" },
            ],
          },
        ],
      }),
    );
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    mockCrearConversorMoneda.mockResolvedValue({});

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.acumuladoPorUsuario["u1"]).toBe(60);
    expect(result.acumuladoPorUsuario["u2"]).toBe(40);
  });

  it("ajusta acumulado por deudas saldadas", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle());
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 50,
        moneda: "CLP",
        saldada: true,
      },
    ]);
    mockCrearConversorMoneda
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.acumuladoPorUsuario["u1"]).toBe(50);
    expect(result.acumuladoPorUsuario["u2"]).toBe(-50);
  });

  it("convierte moneda de deudas saldadas", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle());
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 10,
        moneda: "USD",
        saldada: true,
      },
    ]);
    mockCrearConversorMoneda
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ USD: 900 });

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.acumuladoPorUsuario["u1"]).toBe(9000);
    expect(result.acumuladoPorUsuario["u2"]).toBe(-9000);
  });

  it("ignora deudas no saldadas", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const deudaRepo = crearMockDeudaRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle());
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 50,
        moneda: "CLP",
        saldada: false,
      },
    ]);
    mockCrearConversorMoneda
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);

    expect(result.acumuladoPorUsuario["u1"]).toBeUndefined();
    expect(result.acumuladoPorUsuario["u2"]).toBeUndefined();
  });

  it("lanza error si grupo no existe", async () => {
    const grupoRepo = crearMockGrupoRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      obtenerDetalleGrupo("no-existe", grupoRepo, {} as any),
    ).rejects.toThrow("Grupo no encontrado");
  });
});
