import { obtenerTasaCambio } from "./tasasCambio";

export async function convertirMonto(
  monto: number,
  monedaOrigen: string,
  monedaDestino: string,
): Promise<number> {
  if (!monedaOrigen || !monedaDestino || monedaOrigen === monedaDestino) {
    return monto;
  }
  const { tasa } = await obtenerTasaCambio(monedaOrigen, monedaDestino);
  return Math.round(monto * tasa * 100) / 100;
}

export async function crearConversorMoneda(
  monedaDestino: string,
  monedas: string[],
): Promise<Record<string, number>> {
  const unicas = [...new Set(monedas.filter((m) => m && m !== monedaDestino))];
  const tasas: Record<string, number> = {};

  if (unicas.length > 0) {
    await Promise.all(
      unicas.map(async (from) => {
        try {
          const { tasa } = await obtenerTasaCambio(from, monedaDestino);
          tasas[from] = tasa;
        } catch {
          tasas[from] = 1;
        }
      }),
    );
  }

  return tasas;
}
