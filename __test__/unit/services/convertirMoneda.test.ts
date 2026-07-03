jest.mock("@/shared/servicios/tasasCambio", () => ({
  obtenerTasaCambio: jest.fn(),
}));

import { obtenerTasaCambio } from "@/shared/servicios/tasasCambio";
import {
  convertirMonto,
  crearConversorMoneda,
} from "@/shared/servicios/convertirMoneda";

const mockObtenerTasaCambio = obtenerTasaCambio as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("convertirMonto", () => {
  it("retorna el mismo monto si la moneda origen y destino son iguales", async () => {
    const result = await convertirMonto(100, "CLP", "CLP");
    expect(result).toBe(100);
  });

  it("retorna el mismo monto si monedaOrigen está vacía", async () => {
    const result = await convertirMonto(100, "", "CLP");
    expect(result).toBe(100);
  });

  it("retorna el mismo monto si monedaDestino está vacía", async () => {
    const result = await convertirMonto(100, "USD", "");
    expect(result).toBe(100);
  });

  it("convierte correctamente usando tasa", async () => {
    mockObtenerTasaCambio.mockResolvedValue({ tasa: 900 });
    const result = await convertirMonto(100, "USD", "CLP");
    expect(result).toBe(90000);
  });

  it("redondea a 2 decimales", async () => {
    mockObtenerTasaCambio.mockResolvedValue({ tasa: 899.5 });
    const result = await convertirMonto(10.33, "USD", "CLP");
    expect(result).toBe(9291.84);
  });
});

describe("crearConversorMoneda", () => {
  it("crea mapa de tasas para monedas únicas", async () => {
    mockObtenerTasaCambio
      .mockResolvedValueOnce({ tasa: 900 })
      .mockResolvedValueOnce({ tasa: 1000 });
    const result = await crearConversorMoneda("CLP", ["USD", "EUR"]);
    expect(result).toEqual({ USD: 900, EUR: 1000 });
  });

  it("deduplica monedas repetidas", async () => {
    mockObtenerTasaCambio.mockResolvedValue({ tasa: 900 });
    const result = await crearConversorMoneda("CLP", ["USD", "USD"]);
    expect(mockObtenerTasaCambio).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ USD: 900 });
  });

  it("retorna objeto vacío si no hay monedas", async () => {
    const result = await crearConversorMoneda("CLP", []);
    expect(result).toEqual({});
  });

  it("no incluye moneda base en el mapa", async () => {
    const result = await crearConversorMoneda("CLP", ["CLP"]);
    expect(result).toEqual({});
  });

  it("usa tasa 1 si falla al obtener tasa", async () => {
    mockObtenerTasaCambio.mockRejectedValue(new Error("API error"));
    const result = await crearConversorMoneda("CLP", ["USD"]);
    expect(result).toEqual({ USD: 1 });
  });
});
