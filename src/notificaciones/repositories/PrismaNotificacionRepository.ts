import { prisma } from "@/shared/libs/prisma";
import type { Notificacion, Prisma } from "@prisma/client";
import type {
  INotificacionRepository,
  DatosCrearNotificacion,
} from "./INotificacionRepository";

export class PrismaNotificacionRepository implements INotificacionRepository {
  async crear(datos: DatosCrearNotificacion): Promise<Notificacion> {
    return prisma.notificacion.create({
      data: {
        ...datos,
        metadata: datos.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async crearMuchas(datos: DatosCrearNotificacion[]): Promise<void> {
    if (datos.length === 0) return;
    await prisma.notificacion.createMany({
      data: datos.map((d) => ({
        ...d,
        metadata: d.metadata as Prisma.InputJsonValue,
      })),
    });
  }

  async obtenerPorUsuario(idUsuario: string): Promise<Notificacion[]> {
    return prisma.notificacion.findMany({
      where: { idUsuario },
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  }

  async marcarLeida(id: string, idUsuario: string): Promise<void> {
    await prisma.notificacion.updateMany({
      where: { id, idUsuario },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(idUsuario: string): Promise<void> {
    await prisma.notificacion.updateMany({
      where: { idUsuario, leida: false },
      data: { leida: true },
    });
  }

  async contarNoLeidas(idUsuario: string): Promise<number> {
    return prisma.notificacion.count({
      where: { idUsuario, leida: false },
    });
  }
}
