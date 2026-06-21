import { prisma } from "@/shared/libs/prisma";
import type { Prisma } from "@prisma/client";
import type {
  IMiembroGrupoRepository,
  DatosCrearMiembro,
  MiembroConGrupoYConteo,
  MiembroConUsuario,
} from "./IMiembroGrupoRepository";

export class PrismaMiembroGrupoRepository implements IMiembroGrupoRepository {
  async buscarPorGrupo(
    idGrupo: string,
    tx?: unknown,
  ): Promise<{ idUsuario: string }[]> {
    const client = (tx || prisma) as Prisma.TransactionClient;
    return client.miembroGrupo.findMany({
      where: { idGrupo },
      select: { idUsuario: true },
    });
  }
  async crearMuchas(data: DatosCrearMiembro[], tx?: unknown): Promise<void> {
    const client = (tx || prisma) as Prisma.TransactionClient;
    await client.miembroGrupo.createMany({ data });
  }
  async buscarPorUsuario(idUsuario: string): Promise<MiembroConGrupoYConteo[]> {
    return prisma.miembroGrupo.findMany({
      where: { idUsuario },
      include: {
        grupo: { include: { _count: { select: { miembros: true } } } },
      },
    }) as Promise<MiembroConGrupoYConteo[]>;
  }
  async buscarMiembrosDeGrupos(
    idsGrupos: string[],
  ): Promise<MiembroConUsuario[]> {
    if (idsGrupos.length === 0) return [];
    return prisma.miembroGrupo.findMany({
      where: { idGrupo: { in: idsGrupos } },
      include: { usuario: { select: { id: true, nombre: true } } },
      distinct: ["idUsuario"],
    }) as Promise<MiembroConUsuario[]>;
  }
}
