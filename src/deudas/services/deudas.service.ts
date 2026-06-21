import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { DeudasPendientes, DeudaItem } from "@/deudas/types/deudas";

export async function obtenerDeudasPendientes(
  idUsuario: string,
  deudaRepo: IDeudaRepository,
  idGrupo?: string,
): Promise<DeudasPendientes> {
  const deudas = await deudaRepo.obtenerPendientes(idUsuario, idGrupo);

  const debo_a: DeudaItem[] = [];
  const me_deben: DeudaItem[] = [];

  for (const deuda of deudas) {
    const item: DeudaItem = {
      id: deuda.id,
      monto: Number(deuda.monto),
      grupo: deuda.grupo,
      contraparte: deuda.idDeudor === idUsuario ? deuda.acreedor : deuda.deudor,
      actualizadoEn: deuda.actualizadoEn,
    };

    if (deuda.idDeudor === idUsuario) {
      debo_a.push(item);
    } else {
      me_deben.push(item);
    }
  }

  return { debo_a, me_deben };
}
