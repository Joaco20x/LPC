import { sumarEnMonedaBase } from "@/shared/servicios/sumarMonedas";

describe("sumarEnMonedaBase", () => {
  it("suma montos en moneda base", () => {
    const items = [
      { monto: 100, moneda: "CLP" },
      { monto: 200, moneda: "CLP" },
      { monto: 50, moneda: "CLP" },
    ];
    expect(sumarEnMonedaBase(items, "CLP", {})).toBe(350);
  });

  it("convierte montos en moneda extranjera usando tasa", () => {
    const items = [
      { monto: 100, moneda: "USD" },
      { monto: 50, moneda: "USD" },
    ];
    expect(sumarEnMonedaBase(items, "CLP", { USD: 900 })).toBe(135000);
  });

  it("mezcla moneda base y extranjera", () => {
    const items = [
      { monto: 100, moneda: "CLP" },
      { monto: 10, moneda: "USD" },
    ];
    expect(sumarEnMonedaBase(items, "CLP", { USD: 950 })).toBe(9600);
  });

  it("usa tasa 1 si no hay tasa para la moneda", () => {
    const items = [{ monto: 100, moneda: "EUR" }];
    expect(sumarEnMonedaBase(items, "CLP", {})).toBe(100);
  });

  it("redondea a 2 decimales", () => {
    const items = [{ monto: 10.333, moneda: "USD" }];
    expect(sumarEnMonedaBase(items, "CLP", { USD: 899.5 })).toBe(9294.53);
  });

  it("retorna 0 para array vacío", () => {
    expect(sumarEnMonedaBase([], "CLP", {})).toBe(0);
  });

  it("maneja montos como string", () => {
    const items = [{ monto: "100" }, { monto: "50.5" }];
    expect(sumarEnMonedaBase(items, "CLP", {})).toBe(150.5);
  });
});
