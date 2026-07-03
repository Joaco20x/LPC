import { generarResumenesMensuales } from "@/resumen/services/cronResumen.service";

jest.mock("@/resumen/services/estadisticas.service", () => ({
  calcularEstadisticasRango: jest.fn(),
}));

function crearMocks() {
  const grupoRepo = { obtenerTodosActivos: jest.fn() };
  const gastoRepo = { obtenerPorGrupoYRangoFecha: jest.fn() };
  const resumenRepo = {
    crear: jest.fn(),
    obtenerPorGrupoYMes: jest.fn(),
  };
  const notificacionRepo = { crearMuchas: jest.fn() };
  const deudaRepo = { obtenerTodasPorGrupoIncluyendoSaldadas: jest.fn() };
  return { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo };
}

describe("generarResumenesMensuales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("genera resúmenes para grupos activos", async () => {
    const { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo } =
      crearMocks();
    const {
      calcularEstadisticasRango,
    } = require("@/resumen/services/estadisticas.service");

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "Grupo 1", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 1000,
      porCategoria: {},
      porIntegrante: {},
    });
    resumenRepo.crear.mockResolvedValue({ id: "r1" });
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(resultado.generados).toBe(1);
    expect(resultado.periodo).toBeDefined();
    expect(resumenRepo.crear).toHaveBeenCalledTimes(1);
  });

  it("salta grupos que ya tienen resumen del mes", async () => {
    const { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo } =
      crearMocks();
    const {
      calcularEstadisticasRango,
    } = require("@/resumen/services/estadisticas.service");

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "Grupo 1", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue({
      id: "r-existente",
    });
    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 1000,
      porCategoria: {},
      porIntegrante: {},
    });
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(resultado.generados).toBe(0);
    expect(resumenRepo.crear).not.toHaveBeenCalled();
  });

  it("salta grupos sin gastos (totalGastos <= 0)", async () => {
    const { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo } =
      crearMocks();
    const {
      calcularEstadisticasRango,
    } = require("@/resumen/services/estadisticas.service");

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      { id: "g1", nombre: "Grupo 1", miembros: [] },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 0,
      porCategoria: {},
      porIntegrante: {},
    });
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(resultado.generados).toBe(0);
    expect(resumenRepo.crear).not.toHaveBeenCalled();
  });

  it("notifica a los miembros cuando el grupo tiene integrantes", async () => {
    const { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo } =
      crearMocks();
    const {
      calcularEstadisticasRango,
    } = require("@/resumen/services/estadisticas.service");

    grupoRepo.obtenerTodosActivos.mockResolvedValue([
      {
        id: "g1",
        nombre: "Grupo 1",
        miembros: [{ idUsuario: "u1" }, { idUsuario: "u2" }],
      },
    ]);
    resumenRepo.obtenerPorGrupoYMes.mockResolvedValue(null);
    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 500,
      porCategoria: {},
      porIntegrante: {},
    });
    resumenRepo.crear.mockResolvedValue({ id: "r1" });
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(resultado.generados).toBe(1);
    expect(notificacionRepo.crearMuchas).toHaveBeenCalledTimes(1);
    expect(notificacionRepo.crearMuchas).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          idUsuario: "u1",
          tipo: "NUEVO_RESUMEN_MENSUAL",
        }),
        expect.objectContaining({
          idUsuario: "u2",
          tipo: "NUEVO_RESUMEN_MENSUAL",
        }),
      ]),
    );
  });

  it("retorna la estructura correcta con generados y periodo", async () => {
    const { grupoRepo, gastoRepo, resumenRepo, notificacionRepo, deudaRepo } =
      crearMocks();

    grupoRepo.obtenerTodosActivos.mockResolvedValue([]);

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
      deudaRepo,
    );

    expect(resultado).toHaveProperty("generados");
    expect(resultado).toHaveProperty("periodo");
    expect(resultado.periodo).toHaveProperty("mes");
    expect(resultado.periodo).toHaveProperty("anio");
  });
});
