import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";

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

  for (const gasto of gastos) {
    const monto = Number(gasto.monto);
    totalGastos += monto;

    // Categorías
    if (!porCategoria[gasto.categoria]) {
      porCategoria[gasto.categoria] = 0;
    }
    porCategoria[gasto.categoria] += monto;

    // Inicializar pagador
    if (!porIntegrante[gasto.pagador.id]) {
      porIntegrante[gasto.pagador.id] = {
        id: gasto.pagador.id,
        nombre: gasto.pagador.nombre,
        gastado: 0,
        asignado: 0,
        saldo: 0,
      };
    }
    // El pagador "pone" la plata
    porIntegrante[gasto.pagador.id].gastado += monto;
    porIntegrante[gasto.pagador.id].saldo += monto;

    // Asignaciones
    for (const div of gasto.divisiones) {
      const montoAsignado = Number(div.montoAsignado);

      if (!porIntegrante[div.usuario.id]) {
        porIntegrante[div.usuario.id] = {
          id: div.usuario.id,
          nombre: div.usuario.nombre,
          gastado: 0,
          asignado: 0,
          saldo: 0,
        };
      }

      porIntegrante[div.usuario.id].asignado += montoAsignado;
      porIntegrante[div.usuario.id].saldo -= montoAsignado;
    }
  }

  // Redondear saldos por posibles errores de flotantes
  for (const key in porIntegrante) {
    porIntegrante[key].saldo = Math.round(porIntegrante[key].saldo * 100) / 100;
  }

  return {
    totalGastos,
    porCategoria,
    porIntegrante,
  };
}
