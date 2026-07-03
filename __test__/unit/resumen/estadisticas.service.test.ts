jest.mock("@/shared/servicios/convertirMoneda", () => ({
  crearConversorMoneda: jest.fn(),
}));

import { crearConversorMoneda } from "@/shared/servicios/convertirMoneda";
import { calcularEstadisticasRango } from "@/resumen/services/estadisticas.service";

const mockCrearConversorMoneda = crearConversorMoneda as jest.Mock;

function crearMockGastoRepo() {
  return {
    crear: jest.fn(),
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    obtenerPorGrupoYRangoFecha: jest.fn(),
    obtenerPorGrupo: jest.fn(),
  };
}

function crearGasto(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    idGrupo: "gr1",
    idPagador: "u1",
    monto: 100,
    moneda: "CLP",
    descripcion: "Cena",
    categoria: "Comida",
    urlBoleta: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    pagador: { id: "u1", nombre: "User 1" },
    grupo: { id: "gr1", nombre: "Grupo" },
    divisiones: [
      {
        id: "d1",
        idGasto: "g1",
        idUsuario: "u1",
        montoAsignado: 60,
        tipoDivision: "exacto",
        moneda: "CLP",
        usuario: { id: "u1", nombre: "User 1" },
      },
      {
        id: "d2",
        idGasto: "g1",
        idUsuario: "u2",
        montoAsignado: 40,
        tipoDivision: "exacto",
        moneda: "CLP",
        usuario: { id: "u2", nombre: "User 2" },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("calcularEstadisticasRango", () => {
  it("calcula estadisticas basicas con gastos en moneda base", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      crearGasto({ monto: 100, categoria: "Comida" }),
      crearGasto({ monto: 50, categoria: "Transporte" }),
    ]);

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
    );

    expect(result.totalGastos).toBe(150);
    expect(result.porCategoria).toEqual({ Comida: 100, Transporte: 50 });
  });

  it("convierte monedas cuando monedaBase es distinta", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      crearGasto({ monto: 100, moneda: "USD" }),
    ]);
    mockCrearConversorMoneda.mockResolvedValue({ USD: 900 });

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
    );

    expect(result.totalGastos).toBe(90000);
  });

  it("procesa deudas saldadas", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    mockCrearConversorMoneda.mockResolvedValue({});

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
      [{ idDeudor: "u1", idAcreedor: "u2", monto: 50, moneda: "CLP" }],
    );

    expect(result.porIntegrante["u1"].gastado).toBe(50);
    expect(result.porIntegrante["u1"].saldo).toBe(50);
    expect(result.porIntegrante["u2"].gastado).toBe(-50);
    expect(result.porIntegrante["u2"].saldo).toBe(-50);
  });

  it("convierte moneda de deudas saldadas", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    mockCrearConversorMoneda
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ USD: 900 });

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
      [{ idDeudor: "u1", idAcreedor: "u2", monto: 10, moneda: "USD" }],
    );

    expect(result.porIntegrante["u1"].gastado).toBe(9000);
    expect(result.porIntegrante["u2"].gastado).toBe(-9000);
  });

  it("crea integrantes con nombre vacio si no existen en porIntegrante", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);
    mockCrearConversorMoneda
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
      [{ idDeudor: "new-user", idAcreedor: "u2", monto: 100, moneda: "CLP" }],
    );

    expect(result.porIntegrante["new-user"].nombre).toBe("");
  });

  it("calcula correctamente gastado, asignado y saldo", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      crearGasto({
        monto: 100,
        moneda: "CLP",
        categoria: "Comida",
        pagador: { id: "u1", nombre: "User 1" },
        divisiones: [
          {
            id: "d1",
            idGasto: "g1",
            idUsuario: "u1",
            montoAsignado: 60,
            moneda: "CLP",
            tipoDivision: "exacto",
            usuario: { id: "u1", nombre: "User 1" },
          },
          {
            id: "d2",
            idGasto: "g1",
            idUsuario: "u2",
            montoAsignado: 40,
            moneda: "CLP",
            tipoDivision: "exacto",
            usuario: { id: "u2", nombre: "User 2" },
          },
        ],
      }),
    ]);

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
      "CLP",
    );

    expect(result.porIntegrante["u1"].gastado).toBe(100);
    expect(result.porIntegrante["u1"].asignado).toBe(60);
    expect(result.porIntegrante["u1"].saldo).toBe(40);
    expect(result.porIntegrante["u2"].asignado).toBe(40);
    expect(result.porIntegrante["u2"].saldo).toBe(-40);
  });

  it("retorna estructura vacia si no hay gastos", async () => {
    const gastoRepo = crearMockGastoRepo();
    gastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([]);

    const result = await calcularEstadisticasRango(
      "gr1",
      new Date("2024-01-01"),
      new Date("2024-01-31"),
      gastoRepo,
    );

    expect(result.totalGastos).toBe(0);
    expect(result.porCategoria).toEqual({});
    expect(result.porIntegrante).toEqual({});
  });
});
