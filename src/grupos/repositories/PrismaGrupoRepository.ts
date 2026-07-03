import { prisma } from "@/shared/libs/prisma";
import type { Prisma } from "@prisma/client";
import type {
  IGrupoRepository,
  DatosCrearGrupo,
  DatosActualizarPresupuesto,
  GrupoConDetalles,
  GrupoActivoPayload,
} from "./IGrupoRepository";

export class PrismaGrupoRepository implements IGrupoRepository {
  async crear(data: DatosCrearGrupo, tx?: unknown): Promise<{ id: string }> {
    const client = (tx || prisma) as Prisma.TransactionClient;
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
    }) as Promise<GrupoConDetalles | null>;
  }

  async actualizarEstado(id: string, estado: string): Promise<void> {
    await prisma.grupo.update({
      where: { id },
      data: { estado },
    });
  }

  async actualizarPresupuesto(
    id: string,
    datos: DatosActualizarPresupuesto,
  ): Promise<void> {
    await prisma.grupo.update({
      where: { id },
      data: {
        presupuestoPorPersona: datos.presupuestoPorPersona,
        umbralAlerta: datos.umbralAlerta,
      },
    });
  }

  async obtenerTodosActivos(): Promise<GrupoActivoPayload[]> {
    return prisma.grupo.findMany({
      where: { estado: "activo" },
      include: { miembros: true },
    }) as Promise<GrupoActivoPayload[]>;
  }
}
