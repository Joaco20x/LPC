jest.mock("@/shared/servicios/convertirMoneda", () => ({
  crearConversorMoneda: jest.fn().mockResolvedValue({}),
}));

import { generarResumenesMensuales } from "@/resumen/services/cronResumen.service";

function crearMockGrupoRepo() {
  return {
    crear: jest.fn(),
    obtenerDetalle: jest.fn(),
    actualizarPresupuesto: jest.fn(),
    obtenerTodosActivos: jest.fn(),
  };
}

function crearMockGastoRepo() {
  return {
    crear: jest.fn(),
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorGrupoYRangoFecha: jest.fn(),
    obtenerPorGrupo: jest.fn(),
  };
}

function crearMockResumenRepo() {
  return {
    crear: jest.fn(),
    obtenerPorGrupoYMes: jest.fn(),
  };
}

function crearMockNotificacionRepo() {
  return {
    obtenerPorUsuario: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    crear: jest.fn(),
    crearMuchas: jest.fn(),
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("generarResumenesMensuales", () => {
  it("genera resumenes para grupos activos sin resumen existente", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const gastoRepo = crearMockGastoRepo();
    const resumenRepo = crearMockResumenRepo();
    const notificacionRepo = crearMockNotificacionRepo();
    const deudaRepo = crearMockDeudaRepo();

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      {
        id: "g1",
        nombre: "Grupo 1",
        monedaBase: "CLP",
        miembros: [{ idUsuario: "u1" }, { idUsuario: "u2" }],
      },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 100,
        moneda: "CLP",
        categoria: "Comida",
        pagador: { id: "u1", nombre: "U1" },
        divisiones: [],
      },
    ]);
    resumenRepo.crear.mockResolvedValue({ id: "r1" });

    const result = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(result.generados).toBe(1);
    expect(resumenRepo.crear).toHaveBeenCalledTimes(1);
    expect(notificacionRepo.crearMuchas).toHaveBeenCalledTimes(1);
  });

  it("salta grupos que ya tienen resumen", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const resumenRepo = crearMockResumenRepo();

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "G1", monedaBase: "CLP", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue({ id: "existing" });

    const result = await generarResumenesMensuales(
      grupoRepo,
      {} as any,
      resumenRepo,
      {} as any,
      {} as any,
    );

    expect(result.generados).toBe(0);
  });

  it("salta grupos sin gastos en el periodo", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const gastoRepo = crearMockGastoRepo();
    const resumenRepo = crearMockResumenRepo();
    const deudaRepo = crearMockDeudaRepo();

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "G1", monedaBase: "CLP", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);

    const result = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      {} as any,
      deudaRepo,
    );

    expect(result.generados).toBe(0);
  });

  it("filtra deudas saldadas y las pasa a calcularEstadisticasRango", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const gastoRepo = crearMockGastoRepo();
    const resumenRepo = crearMockResumenRepo();
    const notificacionRepo = crearMockNotificacionRepo();
    const deudaRepo = crearMockDeudaRepo();

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "G1", monedaBase: "CLP", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([
      {
        id: "d1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 50,
        moneda: "CLP",
        saldada: true,
      },
      {
        id: "d2",
        idDeudor: "u3",
        idAcreedor: "u1",
        monto: 30,
        moneda: "CLP",
        saldada: false,
      },
    ]);
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 100,
        moneda: "CLP",
        categoria: "Comida",
        pagador: { id: "u1", nombre: "U1" },
        divisiones: [],
      },
    ]);
    resumenRepo.crear.mockResolvedValue({ id: "r1" });

    const result = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(result.generados).toBe(1);
  });
});
