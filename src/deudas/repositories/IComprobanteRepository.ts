import type { ComprobanteItem } from "@/deudas/types/comprobante";

export interface IComprobanteRepository {
  crear(data: {
    idDeuda: string;
    idUsuario: string;
    urlArchivo: string;
    tipoArchivo: string;
    rut: string;
  }): Promise<ComprobanteItem>;
  obtenerPorDeuda(idDeuda: string): Promise<ComprobanteItem[]>;
  obtenerPorId(id: string): Promise<ComprobanteItem | null>;
  actualizarEstado(
    id: string,
    estado: "aceptado" | "rechazado",
  ): Promise<ComprobanteItem>;
}
