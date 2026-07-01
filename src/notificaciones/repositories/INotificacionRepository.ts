import type { Prisma } from "@prisma/client";

export interface DatosCrearNotificacion {
  idUsuario: string;
  tipo: string;
  metadata?: any;
}

export type NotificacionPayload = Prisma.NotificacionGetPayload<{}>;

export interface INotificacionRepository {
  crear(data: DatosCrearNotificacion): Promise<NotificacionPayload>;
  crearMultiples(data: DatosCrearNotificacion[]): Promise<number>;
}
