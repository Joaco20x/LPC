import { prisma } from "@/shared/libs/prisma";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IGrupoRepository,
  DatosCrearGrupo,
  GrupoConDetalles,
} from "./IGrupoRepository";

export class PrismaGrupoRepository implements IGrupoRepository {
  async crear(
    data: DatosCrearGrupo,
    tx?: TransactionClient,
  ): Promise<{ id: string }> {
    const client = tx ?? prisma;
    return client.grupo.create({ data });
  }
  async obtenerDetalle(id: string): Promise<GrupoConDetalles | null> {
    return prisma.grupo.findUnique({
      where: { id },
      include: {
        miembros: {
          include: {
            usuario: { select: { id: true, nombre: true, correo: true } },
          },
        },
        gastos: {
          orderBy: { creadoEn: "desc" },
          include: {
            pagador: { select: { id: true, nombre: true } },
            divisiones: {
              include: { usuario: { select: { id: true, nombre: true } } },
            },
          },
        },
      },
    });
  }
}
