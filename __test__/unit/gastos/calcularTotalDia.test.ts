import { calcularTotalDia } from "@/gastos/utils/calcularTotalDia";

function mockGasto(overrides: any = {}) {
  return {
    id: "g1",
    monto: 1000,
    moneda: "CLP",
    descripcion: "Test",
    categoria: "comida",
    idPagador: "u1",
    idGrupo: "g1",
    creadoEn: new Date(),
    pagador: { id: "u1", nombre: "Juan" },
    grupo: { id: "g1", nombre: "Viaje" },
    divisiones: [],
    ...overrides,
  };
}

describe("calcularTotalDia", () => {
  it("suma gastos en moneda base", () => {
    const gastos = [mockGasto({ monto: 1000 }), mockGasto({ monto: 2000 })];
    const total = calcularTotalDia(gastos, "CLP", new Map());
    expect(total).toBe(3000);
  });

  it("convierte gastos en moneda extranjera usando tasa", () => {
    const gastos = [
      mockGasto({ monto: 100, moneda: "USD" }),
      mockGasto({ monto: 200, moneda: "USD" }),
    ];
    const tasas = new Map([["USD", 900]]);
    const total = calcularTotalDia(gastos, "CLP", tasas);
    expect(total).toBe(270000);
  });

  it("mezcla gastos en moneda base y extranjera", () => {
    const gastos = [
      mockGasto({ monto: 5000, moneda: "CLP" }),
      mockGasto({ monto: 10, moneda: "USD" }),
    ];
    const tasas = new Map([["USD", 950]]);
    const total = calcularTotalDia(gastos, "CLP", tasas);
    expect(total).toBe(14500);
  });

  it("asigna tasa 1 si no encuentra la moneda en el mapa", () => {
    const gastos = [mockGasto({ monto: 100, moneda: "EUR" })];
    const total = calcularTotalDia(gastos, "CLP", new Map());
    expect(total).toBe(100);
  });

  it("trata gastos sin moneda como moneda base", () => {
    const gastos = [mockGasto({ monto: 5000, moneda: null })];
    const total = calcularTotalDia(gastos, "CLP", new Map());
    expect(total).toBe(5000);
  });

  it("retorna 0 para lista vacía", () => {
    const total = calcularTotalDia([], "CLP", new Map());
    expect(total).toBe(0);
  });
});
