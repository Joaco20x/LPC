import { calcularEstadisticasRango } from "@/resumen/services/estadisticas.service";

function crearMocks() {
  const gastoRepo = { obtenerPorGrupoYRangoFecha: jest.fn() };
  return { gastoRepo };
}

describe("calcularEstadisticasRango", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calcula totalGastos correctamente", async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 100,
        categoria: "Comida",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 50, usuario: { id: "u1", nombre: "Alice" } },
          { montoAsignado: 50, usuario: { id: "u2", nombre: "Bob" } },
        ],
      },
      {
        monto: 200,
        categoria: "Transporte",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 100, usuario: { id: "u1", nombre: "Alice" } },
          { montoAsignado: 100, usuario: { id: "u2", nombre: "Bob" } },
        ],
      },
    ]);

    const stats = await calcularEstadisticasRango(
      "g1",
      new Date("2026-06-01"),
      new Date("2026-06-30"),
      gastoRepo,
    );

    expect(stats.totalGastos).toBe(300);
  });

  it("agrupa montos por categoría", async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 150,
        categoria: "Comida",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 150, usuario: { id: "u1", nombre: "Alice" } },
        ],
      },
      {
        monto: 300,
        categoria: "Comida",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 300, usuario: { id: "u1", nombre: "Alice" } },
        ],
      },
      {
        monto: 100,
        categoria: "Transporte",
        pagador: { id: "u2", nombre: "Bob" },
        divisiones: [
          { montoAsignado: 100, usuario: { id: "u2", nombre: "Bob" } },
        ],
      },
    ]);

    const stats = await calcularEstadisticasRango(
      "g1",
      new Date("2026-06-01"),
      new Date("2026-06-30"),
      gastoRepo,
    );

    expect(stats.porCategoria).toEqual({
      Comida: 450,
      Transporte: 100,
    });
  });

  it("calcula gastado, asignado y saldo por integrante", async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 200,
        categoria: "Comida",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 100, usuario: { id: "u1", nombre: "Alice" } },
          { montoAsignado: 100, usuario: { id: "u2", nombre: "Bob" } },
        ],
      },
      {
        monto: 150,
        categoria: "Transporte",
        pagador: { id: "u2", nombre: "Bob" },
        divisiones: [
          { montoAsignado: 75, usuario: { id: "u1", nombre: "Alice" } },
          { montoAsignado: 75, usuario: { id: "u2", nombre: "Bob" } },
        ],
      },
    ]);

    const stats = await calcularEstadisticasRango(
      "g1",
      new Date("2026-06-01"),
      new Date("2026-06-30"),
      gastoRepo,
    );

    expect(stats.porIntegrante["u1"].gastado).toBe(200);
    expect(stats.porIntegrante["u1"].asignado).toBe(175);
    expect(stats.porIntegrante["u1"].saldo).toBe(25);

    expect(stats.porIntegrante["u2"].gastado).toBe(150);
    expect(stats.porIntegrante["u2"].asignado).toBe(175);
    expect(stats.porIntegrante["u2"].saldo).toBe(-25);
  });

  it("maneja una lista de gastos vacía", async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);

    const stats = await calcularEstadisticasRango(
      "g1",
      new Date("2026-06-01"),
      new Date("2026-06-30"),
      gastoRepo,
    );

    expect(stats.totalGastos).toBe(0);
    expect(stats.porCategoria).toEqual({});
    expect(stats.porIntegrante).toEqual({});
  });

  it("redondea saldos a dos decimales", async () => {
    const { gastoRepo } = crearMocks();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      {
        monto: 100,
        categoria: "Comida",
        pagador: { id: "u1", nombre: "Alice" },
        divisiones: [
          { montoAsignado: 33.33, usuario: { id: "u1", nombre: "Alice" } },
          { montoAsignado: 33.33, usuario: { id: "u2", nombre: "Bob" } },
          { montoAsignado: 33.34, usuario: { id: "u3", nombre: "Carol" } },
        ],
      },
    ]);

    const stats = await calcularEstadisticasRango(
      "g1",
      new Date("2026-06-01"),
      new Date("2026-06-30"),
      gastoRepo,
    );

    expect(stats.porIntegrante["u1"].saldo).toBe(66.67);
  });
});
