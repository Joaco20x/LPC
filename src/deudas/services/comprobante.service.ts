import { validarRut } from "@/deudas/validaciones/rut";
import type { IComprobanteRepository } from "@/deudas/repositories/IComprobanteRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { ComprobanteItem } from "@/deudas/types/comprobante";

export class ComprobanteService {
  constructor(
    private readonly comprobanteRepo: IComprobanteRepository,
    private readonly deudaRepo: IDeudaRepository,
  ) {}

  async subir(
    idDeuda: string,
    idUsuario: string,
    rut: string,
    urlArchivo: string,
    tipoArchivo: string,
  ): Promise<ComprobanteItem> {
    const deuda = await this.deudaRepo.obtenerPorId(idDeuda);
    if (!deuda) throw new Error("Deuda no encontrada");
    if (deuda.idDeudor !== idUsuario)
      throw new Error("Solo el deudor puede subir un comprobante");
    if (deuda.saldada) throw new Error("La deuda ya está saldada");

    const rutLimpio = rut.replaceAll(".", "");
    if (!validarRut(rutLimpio)) throw new Error("RUT inválido");

    return this.comprobanteRepo.crear({
      idDeuda,
      idUsuario,
      urlArchivo,
      tipoArchivo,
      rut: rutLimpio,
    });
  }

  async obtenerHistorial(
    idDeuda: string,
    idUsuario: string,
  ): Promise<ComprobanteItem[]> {
    const deuda = await this.deudaRepo.obtenerPorId(idDeuda);
    if (!deuda) throw new Error("Deuda no encontrada");
    if (deuda.idDeudor !== idUsuario && deuda.idAcreedor !== idUsuario)
      throw new Error("No tienes acceso a esta deuda");
    return this.comprobanteRepo.obtenerPorDeuda(idDeuda);
  }

  async aceptar(
    idComprobante: string,
    idUsuario: string,
  ): Promise<ComprobanteItem> {
    const comprobante = await this.comprobanteRepo.obtenerPorId(idComprobante);
    if (!comprobante) throw new Error("Comprobante no encontrado");

    const deuda = await this.deudaRepo.obtenerPorId(comprobante.idDeuda);
    if (!deuda) throw new Error("Deuda no encontrada");
    if (deuda.idAcreedor !== idUsuario)
      throw new Error("Solo el acreedor puede aceptar el comprobante");
    if (comprobante.estado !== "pendiente")
      throw new Error("El comprobante ya fue procesado");

    await this.deudaRepo.actualizarEstado(
      comprobante.idDeuda,
      "pagada",
      new Date(),
    );

    return this.comprobanteRepo.actualizarEstado(idComprobante, "aceptado");
  }

  async rechazar(
    idComprobante: string,
    idUsuario: string,
  ): Promise<ComprobanteItem> {
    const comprobante = await this.comprobanteRepo.obtenerPorId(idComprobante);
    if (!comprobante) throw new Error("Comprobante no encontrado");

    const deuda = await this.deudaRepo.obtenerPorId(comprobante.idDeuda);
    if (!deuda) throw new Error("Deuda no encontrada");
    if (deuda.idAcreedor !== idUsuario)
      throw new Error("Solo el acreedor puede rechazar el comprobante");
    if (comprobante.estado !== "pendiente")
      throw new Error("El comprobante ya fue procesado");

    return this.comprobanteRepo.actualizarEstado(idComprobante, "rechazado");
  }
}
