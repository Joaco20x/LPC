import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import { crearConversorMoneda } from "@/shared/servicios/convertirMoneda";

export interface DeudaSaldadaInput {
  idDeudor: string;
  idAcreedor: string;
  monto: number;
  moneda: string;
}

interface Integrante {
  id: string;
  nombre: string;
  gastado: number;
  asignado: number;
  saldo: number;
}

type PorIntegrante = Record<string, Integrante>;

export interface EstadisticasMensuales {
  totalGastos: number;
  porCategoria: Record<string, number>;
  porIntegrante: PorIntegrante;
}

function asegurarIntegrante(
  porIntegrante: PorIntegrante,
  id: string,
  nombre: string,
): Integrante {
  if (!porIntegrante[id]) {
    porIntegrante[id] = { id, nombre, gastado: 0, asignado: 0, saldo: 0 };
  }
  return porIntegrante[id];
}

function procesarGastoEnEstadisticas(
  gasto: Awaited<
    ReturnType<IGastoRepository["obtenerPorGrupoYRangoFecha"]>
  >[number],
  totalGastos: { value: number },
  porCategoria: Record<string, number>,
  porIntegrante: PorIntegrante,
  monedaBase: string | undefined,
  convGasto: Record<string, number> | undefined,
) {
  const monto = Number(gasto.monto);
  const tasaGasto =
    monedaBase && convGasto && gasto.moneda
      ? (convGasto[gasto.moneda] ?? 1)
      : 1;
  const montoEnBase = monto * tasaGasto;
  totalGastos.value += montoEnBase;

  porCategoria[gasto.categoria] =
    (porCategoria[gasto.categoria] ?? 0) + montoEnBase;

  const pagador = asegurarIntegrante(
    porIntegrante,
    gasto.pagador.id,
    gasto.pagador.nombre,
  );
  pagador.gastado += montoEnBase;
  pagador.saldo += montoEnBase;

  for (const div of gasto.divisiones) {
    const montoAsignado = Number(div.montoAsignado);
    const monedaDiv = div.moneda || gasto.moneda;
    const tasaDiv =
      monedaBase && convGasto && monedaDiv ? (convGasto[monedaDiv] ?? 1) : 1;
    const montoAsignadoEnBase = montoAsignado * tasaDiv;

    const integrante = asegurarIntegrante(
      porIntegrante,
      div.usuario.id,
      div.usuario.nombre,
    );
    integrante.asignado += montoAsignadoEnBase;
    integrante.saldo -= montoAsignadoEnBase;
  }
}

function procesarDeudasSaldadas(
  deudasSaldadas: DeudaSaldadaInput[],
  porIntegrante: PorIntegrante,
  monedaBase: string,
  convDeudas: Record<string, number>,
) {
  for (const deuda of deudasSaldadas) {
    const tasa =
      deuda.moneda && deuda.moneda !== monedaBase
        ? (convDeudas[deuda.moneda] ?? 1)
        : 1;
    const montoEnBase = deuda.monto * tasa;

    const deudor = asegurarIntegrante(porIntegrante, deuda.idDeudor, "");
    deudor.gastado += montoEnBase;
    deudor.saldo += montoEnBase;

    const acreedor = asegurarIntegrante(porIntegrante, deuda.idAcreedor, "");
    acreedor.gastado -= montoEnBase;
    acreedor.saldo -= montoEnBase;
  }
}

export async function calcularEstadisticasRango(
  idGrupo: string,
  inicio: Date,
  fin: Date,
  gastoRepo: IGastoRepository,
  monedaBase?: string,
  deudasSaldadas?: DeudaSaldadaInput[],
): Promise<EstadisticasMensuales> {
  const gastos = await gastoRepo.obtenerPorGrupoYRangoFecha(
    idGrupo,
    inicio,
    fin,
  );

  const totalGastos = { value: 0 };
  const porCategoria: Record<string, number> = {};
  const porIntegrante: PorIntegrante = {};

  const monedasGasto = gastos.map((g) => g.moneda).filter(Boolean);
  const monedasDivision = gastos.flatMap((g) =>
    g.divisiones.map((d) => d.moneda || g.moneda).filter(Boolean),
  );
  const convGasto = monedaBase
    ? await crearConversorMoneda(monedaBase, [
        ...monedasGasto,
        ...monedasDivision,
      ])
    : undefined;

  for (const gasto of gastos) {
    procesarGastoEnEstadisticas(
      gasto,
      totalGastos,
      porCategoria,
      porIntegrante,
      monedaBase,
      convGasto,
    );
  }

  if (monedaBase && deudasSaldadas && deudasSaldadas.length > 0) {
    const monedasDeudas = deudasSaldadas.map((d) => d.moneda).filter(Boolean);
    const convDeudas = await crearConversorMoneda(monedaBase, monedasDeudas);
    procesarDeudasSaldadas(
      deudasSaldadas,
      porIntegrante,
      monedaBase,
      convDeudas,
    );
  }

  for (const key in porIntegrante) {
    porIntegrante[key].saldo = Math.round(porIntegrante[key].saldo * 100) / 100;
  }

  return {
    totalGastos: totalGastos.value,
    porCategoria,
    porIntegrante,
  };
}
