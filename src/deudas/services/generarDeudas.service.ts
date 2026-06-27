import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

interface DivisionInput {
  idUsuario: string;
}
interface DatosGenerarDeudas {
  idGrupo: string;
  monto: number;
  divisiones: DivisionInput[];
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export async function generarDeudas(
  datos: DatosGenerarDeudas,
  miembroRepo: IMiembroGrupoRepository,
  deudaRepo: IDeudaRepository,
  tx: TransactionClient,
) {
  const miembrosGrupo = await miembroRepo.buscarPorGrupo(datos.idGrupo, tx);
  const totalMiembros = miembrosGrupo.length;

  if (totalMiembros <= 1) return;

  const idsEnDivisiones = new Set(datos.divisiones.map((d) => d.idUsuario));
  const deudores = miembrosGrupo
    .map((m) => m.idUsuario)
    .filter((id) => !idsEnDivisiones.has(id));

  if (deudores.length === 0) return;

  const partePorPersona = datos.monto / totalMiembros;
  const montoPorAcreedor = redondear(partePorPersona / idsEnDivisiones.size);

  const nuevasDeudas = deudores.flatMap((idDeudor) =>
    [...idsEnDivisiones].map((idAcreedor) => ({
      idGrupo: datos.idGrupo,
      idDeudor,
      idAcreedor,
      monto: montoPorAcreedor,
      saldada: false,
    })),
  );

  await deudaRepo.crearMuchas(nuevasDeudas, tx);
}
