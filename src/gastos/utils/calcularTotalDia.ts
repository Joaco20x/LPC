import type { GastoConRelaciones } from "@/gastos/repositories/IGastoRepository";

export function calcularTotalDia(
  gastos: GastoConRelaciones[],
  monedaBase: string,
  tasas: Map<string, number>,
): number {
  return gastos.reduce((total, g) => {
    const monto = Number(g.monto);
    if (!g.moneda || g.moneda === monedaBase) return total + monto;
    const tasa = tasas.get(g.moneda) ?? 1;
    return total + monto * tasa;
  }, 0);
}
