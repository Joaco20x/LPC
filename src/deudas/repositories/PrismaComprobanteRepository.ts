import { prisma } from "@/shared/libs/prisma";
import type { ComprobanteItem } from "@/deudas/types/comprobante";
import type { IComprobanteRepository } from "./IComprobanteRepository";

export class PrismaComprobanteRepository implements IComprobanteRepository {
  async crear(data: {
    idDeuda: string;
    idUsuario: string;
    urlArchivo: string;
    tipoArchivo: string;
    rut: string;
  }): Promise<ComprobanteItem> {
    const result = await prisma.comprobantePago.create({
      data: {
        idDeuda: data.idDeuda,
        idUsuario: data.idUsuario,
        urlArchivo: data.urlArchivo,
        tipoArchivo: data.tipoArchivo,
        rut: data.rut,
      },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
    return this._map(result);
  }

  async obtenerPorDeuda(idDeuda: string): Promise<ComprobanteItem[]> {
    const items = await prisma.comprobantePago.findMany({
      where: { idDeuda },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
      orderBy: { creadoEn: "desc" },
    });
    return items.map(this._map);
  }

  async obtenerPorId(id: string): Promise<ComprobanteItem | null> {
    const item = await prisma.comprobantePago.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
    return item ? this._map(item) : null;
  }

  async actualizarEstado(
    id: string,
    estado: "aceptado" | "rechazado",
  ): Promise<ComprobanteItem> {
    const now = new Date();
    const result = await prisma.comprobantePago.update({
      where: { id },
      data: {
        estado,
        ...(estado === "aceptado" ? { aceptadoEn: now } : { rechazadoEn: now }),
      },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
    return this._map(result);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _map(item: any): ComprobanteItem {
    return {
      id: item.id,
      idDeuda: item.idDeuda,
      idUsuario: item.idUsuario,
      urlArchivo: item.urlArchivo,
      tipoArchivo: item.tipoArchivo,
      rut: item.rut,
      estado: item.estado,
      aceptadoEn: item.aceptadoEn ?? null,
      rechazadoEn: item.rechazadoEn ?? null,
      creadoEn: item.creadoEn,
      usuario: item.usuario,
    };
  }
}
