import { prisma } from '@/backend/db/prisma';
import type { IGrupoRepository, DatosCrearGrupo, GrupoConDetalles } from '@/shared/repositories/IGrupoRepository';

export class PrismaGrupoRepository implements IGrupoRepository {
  async crear(data: DatosCrearGrupo, tx?: unknown): Promise<any> {
    const client = tx as any || prisma;
    return client.grupo.create({ data });
  }
  async obtenerDetalle(id: string): Promise<GrupoConDetalles | null> {
    return prisma.grupo.findUnique({
      where: { id },
      include: {
        miembros: { include: { usuario: { select: { id: true, nombre: true, correo: true } } } },
        gastos: {
          orderBy: { creadoEn: 'desc' },
          include: {
            pagador: { select: { id: true, nombre: true } },
            divisiones: { include: { usuario: { select: { id: true, nombre: true } } } },
          },
        },
      },
    }) as Promise<GrupoConDetalles | null>;
  }
}
