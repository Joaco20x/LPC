import { obtenerResumenViaje } from "@/resumen/services/resumenViaje.service";

jest.mock("@/resumen/services/estadisticas.service", () => ({
  calcularEstadisticasRango: jest.fn(),
}));

function crearMocks() {
  const gastoRepo = {
    obtenerPorGrupoYRangoFecha: jest.fn(),
    obtenerPorGrupo: jest.fn(),
  };
  const grupoRepo = {
    obtenerDetalle: jest.fn(),
    obtenerTodosActivos: jest.fn(),
  };
  const deudaRepo = {
    obtenerTodasPorGrupo: jest.fn(),
    obtenerTodasPorGrupoIncluyendoSaldadas: jest.fn(),
    obtenerPendientes: jest.fn(),
  };
  return { gastoRepo, grupoRepo, deudaRepo };
}

const grupoBase = {
  id: "g1",
  nombre: "Viaje a Chile",
  destino: "Santiago",
  fechaInicio: new Date("2026-06-01"),
  fechaFin: new Date("2026-06-10"),
  monedaBase: "CLP",
  presupuestoPorPersona: null,
  umbralAlerta: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  estado: "activo",
};

describe("obtenerResumenViaje", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna resumen completo con gastos y deudas", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );

    grupoRepo.obtenerDetalle.mockResolvedValue({
      ...grupoBase,
      miembros: [],
      gastos: [],
    });

    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 300000,
      porCategoria: {
        Comida: 150000,
        Transporte: 100000,
        Alojamiento: 50000,
      },
      porIntegrante: {
        u1: {
          id: "u1",
          nombre: "Alice",
          gastado: 200000,
          asignado: 150000,
          saldo: 50000,
        },
        u2: {
          id: "u2",
          nombre: "Bob",
          gastado: 100000,
          asignado: 150000,
          saldo: -50000,
        },
      },
    });

    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      { id: "gasto1" },
      { id: "gasto2" },
      { id: "gasto3" },
    ]);

    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([
      {
        idDeudor: "u2",
        idAcreedor: "u1",
        monto: 50000,
        moneda: "CLP",
        deudor: { nombre: "Bob" },
        acreedor: { nombre: "Alice" },
      },
    ]);

    const resultado = await obtenerResumenViaje(
      "g1",
      gastoRepo as any,
      grupoRepo as any,
      deudaRepo as any,
    );

    expect(resultado.resumenGeneral.totalGastos).toBe(300000);
    expect(resultado.resumenGeneral.cantidadGastos).toBe(3);
    expect(resultado.resumenGeneral.duracionDias).toBe(10);
    expect(resultado.resumenGeneral.moneda).toBe("CLP");

    expect(resultado.porCategoria).toHaveLength(3);
    expect(resultado.porCategoria[0].categoria).toBe("Comida");
    expect(resultado.porCategoria[0].porcentaje).toBe(50);

    expect(resultado.porIntegrante).toHaveLength(2);
    expect(resultado.porIntegrante[0].balance).toBe(50000);
    expect(resultado.porIntegrante[1].balance).toBe(-50000);

    expect(resultado.ranking.mayorGasto.nombre).toBe("Alice");
    expect(resultado.ranking.mayorPagador.nombre).toBe("Alice");

    expect(resultado.deudas).toHaveLength(1);
    expect(resultado.deudas[0].deudor.nombre).toBe("Bob");
  });

  it("lanza error si el grupo no existe", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      obtenerResumenViaje(
        "g1",
        gastoRepo as any,
        grupoRepo as any,
        deudaRepo as any,
      ),
    ).rejects.toThrow("Grupo no encontrado");
  });

  it("retorna arrays vacios cuando no hay gastos", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );

    grupoRepo.obtenerDetalle.mockResolvedValue({
      ...grupoBase,
      miembros: [],
      gastos: [],
    });

    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 0,
      porCategoria: {},
      porIntegrante: {},
    });

    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([]);

    const resultado = await obtenerResumenViaje(
      "g1",
      gastoRepo as any,
      grupoRepo as any,
      deudaRepo as any,
    );

    expect(resultado.resumenGeneral.totalGastos).toBe(0);
    expect(resultado.resumenGeneral.cantidadGastos).toBe(0);
    expect(resultado.porCategoria).toHaveLength(0);
    expect(resultado.porIntegrante).toHaveLength(0);
    expect(resultado.deudas).toHaveLength(0);
    expect(resultado.ranking.mayorGasto.monto).toBe(0);
  });

  it("retorna una sola categoria", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );

    grupoRepo.obtenerDetalle.mockResolvedValue({
      ...grupoBase,
      miembros: [],
      gastos: [],
    });

    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 50000,
      porCategoria: { Comida: 50000 },
      porIntegrante: {
        u1: {
          id: "u1",
          nombre: "Alice",
          gastado: 50000,
          asignado: 50000,
          saldo: 0,
        },
      },
    });

    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([{ id: "g1" }]);
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([]);

    const resultado = await obtenerResumenViaje(
      "g1",
      gastoRepo as any,
      grupoRepo as any,
      deudaRepo as any,
    );

    expect(resultado.porCategoria).toHaveLength(1);
    expect(resultado.porCategoria[0].porcentaje).toBe(100);
  });

  it("retorna ranking vacio cuando ranking no tiene datos", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );

    grupoRepo.obtenerDetalle.mockResolvedValue({
      ...grupoBase,
      miembros: [],
      gastos: [],
    });

    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 0,
      porCategoria: {},
      porIntegrante: {},
    });

    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([]);

    const r = await obtenerResumenViaje(
      "g1",
      gastoRepo as any,
      grupoRepo as any,
      deudaRepo as any,
    );

    expect(r.ranking.mayorGasto.nombre).toBe("");
    expect(r.ranking.mayorGasto.monto).toBe(0);
    expect(r.ranking.mayorPagador.nombre).toBe("");
    expect(r.ranking.mayorPagador.monto).toBe(0);
  });

  it("incluye grupo.fechaInicio y grupo.fechaFin como ISO string", async () => {
    const { gastoRepo, grupoRepo, deudaRepo } = crearMocks();
    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );

    grupoRepo.obtenerDetalle.mockResolvedValue({
      ...grupoBase,
      miembros: [],
      gastos: [],
    });

    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 0,
      porCategoria: {},
      porIntegrante: {},
    });

    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([]);

    const r = await obtenerResumenViaje(
      "g1",
      gastoRepo as any,
      grupoRepo as any,
      deudaRepo as any,
    );

    expect(typeof r.grupo.fechaInicio).toBe("string");
    expect(typeof r.grupo.fechaFin).toBe("string");
    expect(r.grupo.duracionDias).toBe(10);
  });
});
