import type { Notificacion } from "@prisma/client";

export type TipoNotificacion =
  | "nuevo_gasto"
  | "pago_deuda"
  | "alerta_deuda"
  | "cierre_viaje"
  | "presupuesto_superado"
  | "integrante_anadido"
  | "NUEVO_RESUMEN_MENSUAL";

export interface DatosCrearNotificacion {
  idUsuario: string;
  tipo: TipoNotificacion;
  metadata: Record<string, unknown>;
}

export interface INotificacionRepository {
  crear(datos: DatosCrearNotificacion): Promise<Notificacion>;
  crearMuchas(datos: DatosCrearNotificacion[]): Promise<void>;
  obtenerPorUsuario(idUsuario: string): Promise<Notificacion[]>;
  marcarLeida(id: string, idUsuario: string): Promise<void>;
  marcarTodasLeidas(idUsuario: string): Promise<void>;
  contarNoLeidas(idUsuario: string): Promise<number>;
}
