import { prisma } from "@/shared/libs/prisma";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IMiembroGrupoRepository,
  DatosCrearMiembro,
  MiembroConGrupoYConteo,
  MiembroConUsuario,
} from "./IMiembroGrupoRepository";

export class PrismaMiembroGrupoRepository implements IMiembroGrupoRepository {
  async buscarPorGrupo(
    idGrupo: string,
    tx?: TransactionClient,
  ): Promise<{ idUsuario: string }[]> {
    const client = tx ?? prisma;
    return client.miembroGrupo.findMany({
      where: { idGrupo },
      select: { idUsuario: true },
    });
  }
  async crearMuchas(
    data: DatosCrearMiembro[],
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.miembroGrupo.createMany({ data });
  }
  async buscarPorUsuario(idUsuario: string): Promise<MiembroConGrupoYConteo[]> {
    return prisma.miembroGrupo.findMany({
      where: { idUsuario },
      include: {
        grupo: { include: { _count: { select: { miembros: true } } } },
      },
    });
  }
  async buscarMiembrosDeGrupos(
    idsGrupos: string[],
  ): Promise<MiembroConUsuario[]> {
    if (idsGrupos.length === 0) return [];
    return prisma.miembroGrupo.findMany({
      where: { idGrupo: { in: idsGrupos } },
      include: { usuario: { select: { id: true, nombre: true } } },
      distinct: ["idUsuario"],
    });
  }
}
