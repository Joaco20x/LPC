import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import { calcularEstadisticasRango } from "./estadisticas.service";
import type {
  ResumenViaje,
  ResumenCategoria,
  ResumenIntegrante,
  DeudaResumen,
} from "../types/resumenViaje";

export async function obtenerResumenViaje(
  idGrupo: string,
  gastoRepo: IGastoRepository,
  grupoRepo: IGrupoRepository,
  deudaRepo: IDeudaRepository,
): Promise<ResumenViaje> {
  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const fechaInicio = new Date(grupo.fechaInicio);
  const fechaFin = new Date(grupo.fechaFin);
  const monedaBase = grupo.monedaBase;

  const stats = await calcularEstadisticasRango(
    idGrupo,
    fechaInicio,
    fechaFin,
    gastoRepo,
    monedaBase,
  );

  const gastos = await gastoRepo.obtenerPorGrupoYRangoFecha(
    idGrupo,
    fechaInicio,
    fechaFin,
  );
  const cantidadGastos = gastos.length;

  const deudas = await deudaRepo.obtenerTodasPorGrupo(idGrupo);
  const deudasData: DeudaResumen[] = deudas.map((d) => ({
    deudor: { id: d.idDeudor, nombre: d.deudor.nombre },
    acreedor: { id: d.idAcreedor, nombre: d.acreedor.nombre },
    monto: Number(d.monto),
    moneda: d.moneda,
  }));

  const diffMs = fechaFin.getTime() - fechaInicio.getTime();
  const duracionDias = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

  const totalGastos = stats.totalGastos;
  const porCategoria: ResumenCategoria[] = Object.entries(
    stats.porCategoria,
  ).map(([categoria, monto]) => ({
    categoria,
    monto,
    porcentaje:
      totalGastos > 0 ? Math.round((monto / totalGastos) * 100 * 100) / 100 : 0,
  }));

  const porIntegrante: ResumenIntegrante[] = Object.values(
    stats.porIntegrante,
  ).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    gastado: i.gastado,
    pagado: i.gastado,
    balance: i.saldo,
  }));

  const sortedByGasto = [...porIntegrante].sort(
    (a, b) => b.gastado - a.gastado,
  );
  const sortedByPagado = [...porIntegrante].sort((a, b) => b.pagado - a.pagado);

  const vacio = { id: "", nombre: "", monto: 0 };

  return {
    grupo: {
      id: grupo.id,
      nombre: grupo.nombre,
      destino: grupo.destino,
      fechaInicio: grupo.fechaInicio.toISOString(),
      fechaFin: grupo.fechaFin.toISOString(),
      duracionDias,
      monedaBase,
    },
    resumenGeneral: {
      totalGastos,
      cantidadGastos,
      duracionDias,
      moneda: monedaBase,
    },
    porCategoria,
    porIntegrante,
    ranking: {
      mayorGasto: sortedByGasto[0]
        ? {
            id: sortedByGasto[0].id,
            nombre: sortedByGasto[0].nombre,
            monto: sortedByGasto[0].gastado,
          }
        : vacio,
      mayorPagador: sortedByPagado[0]
        ? {
            id: sortedByPagado[0].id,
            nombre: sortedByPagado[0].nombre,
            monto: sortedByPagado[0].pagado,
          }
        : vacio,
    },
    deudas: deudasData,
  };
}
