export function sumarEnMonedaBase(
  items: Array<{ monto: number | string; moneda?: string | null }>,
  monedaBase: string,
  tasas: Record<string, number>,
): number {
  let total = 0;
  for (const item of items) {
    const monto = Number(item.monto);
    if (!item.moneda || item.moneda === monedaBase) {
      total += monto;
    } else {
      const tasa = tasas[item.moneda] ?? 1;
      total += monto * tasa;
    }
  }
  return Math.round(total * 100) / 100;
}
