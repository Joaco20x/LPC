import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import { crearConversorMoneda } from "@/shared/servicios/convertirMoneda";

export interface DeudaSaldadaInput {
  idDeudor: string;
  idAcreedor: string;
  monto: number;
  moneda: string;
}

export interface EstadisticasMensuales {
  totalGastos: number;
  porCategoria: Record<string, number>;
  porIntegrante: Record<
    string,
    {
      id: string;
      nombre: string;
      gastado: number;
      asignado: number;
      saldo: number;
    }
  >;
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

  let totalGastos = 0;
  const porCategoria: Record<string, number> = {};
  const porIntegrante: Record<
    string,
    {
      id: string;
      nombre: string;
      gastado: number;
      asignado: number;
      saldo: number;
    }
  > = {};

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
    const monto = Number(gasto.monto);
    const tasaGasto =
      monedaBase && convGasto && gasto.moneda
        ? (convGasto[gasto.moneda] ?? 1)
        : 1;
    const montoEnBase = monto * tasaGasto;
    totalGastos += montoEnBase;

    if (!porCategoria[gasto.categoria]) {
      porCategoria[gasto.categoria] = 0;
    }
    porCategoria[gasto.categoria] += montoEnBase;

    if (!porIntegrante[gasto.pagador.id]) {
      porIntegrante[gasto.pagador.id] = {
        id: gasto.pagador.id,
        nombre: gasto.pagador.nombre,
        gastado: 0,
        asignado: 0,
        saldo: 0,
      };
    }
    porIntegrante[gasto.pagador.id].gastado += montoEnBase;
    porIntegrante[gasto.pagador.id].saldo += montoEnBase;

    for (const div of gasto.divisiones) {
      const montoAsignado = Number(div.montoAsignado);
      const monedaDiv = div.moneda || gasto.moneda;
      const tasaDiv =
        monedaBase && convGasto && monedaDiv ? (convGasto[monedaDiv] ?? 1) : 1;
      const montoAsignadoEnBase = montoAsignado * tasaDiv;

      if (!porIntegrante[div.usuario.id]) {
        porIntegrante[div.usuario.id] = {
          id: div.usuario.id,
          nombre: div.usuario.nombre,
          gastado: 0,
          asignado: 0,
          saldo: 0,
        };
      }

      porIntegrante[div.usuario.id].asignado += montoAsignadoEnBase;
      porIntegrante[div.usuario.id].saldo -= montoAsignadoEnBase;
    }
  }

  if (monedaBase && deudasSaldadas && deudasSaldadas.length > 0) {
    const monedasDeudas = deudasSaldadas.map((d) => d.moneda).filter(Boolean);
    const convDeudas = await crearConversorMoneda(monedaBase, monedasDeudas);
    for (const deuda of deudasSaldadas) {
      const tasa =
        deuda.moneda && deuda.moneda !== monedaBase
          ? (convDeudas[deuda.moneda] ?? 1)
          : 1;
      const montoEnBase = deuda.monto * tasa;

      if (!porIntegrante[deuda.idDeudor]) {
        porIntegrante[deuda.idDeudor] = {
          id: deuda.idDeudor,
          nombre: "",
          gastado: 0,
          asignado: 0,
          saldo: 0,
        };
      }
      porIntegrante[deuda.idDeudor].gastado += montoEnBase;
      porIntegrante[deuda.idDeudor].saldo += montoEnBase;

      if (!porIntegrante[deuda.idAcreedor]) {
        porIntegrante[deuda.idAcreedor] = {
          id: deuda.idAcreedor,
          nombre: "",
          gastado: 0,
          asignado: 0,
          saldo: 0,
        };
      }
      porIntegrante[deuda.idAcreedor].gastado -= montoEnBase;
      porIntegrante[deuda.idAcreedor].saldo -= montoEnBase;
    }
  }

  for (const key in porIntegrante) {
    porIntegrante[key].saldo = Math.round(porIntegrante[key].saldo * 100) / 100;
  }

  return {
    totalGastos,
    porCategoria,
    porIntegrante,
  };
}
