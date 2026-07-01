import { prisma } from "@/shared/libs/prisma";
import type {
  INotificacionRepository,
  DatosCrearNotificacion,
  NotificacionPayload,
} from "./INotificacionRepository";

export class PrismaNotificacionRepository implements INotificacionRepository {
  async crear(data: DatosCrearNotificacion): Promise<NotificacionPayload> {
    return prisma.notificacion.create({
      data: {
        idUsuario: data.idUsuario,
        tipo: data.tipo,
        metadata: data.metadata || {},
      },
    });
  }

  async crearMultiples(data: DatosCrearNotificacion[]): Promise<number> {
    if (data.length === 0) return 0;

    const resultado = await prisma.notificacion.createMany({
      data: data.map((n) => ({
        idUsuario: n.idUsuario,
        tipo: n.tipo,
        metadata: n.metadata || {},
      })),
      skipDuplicates: true,
    });

    return resultado.count;
  }
}
