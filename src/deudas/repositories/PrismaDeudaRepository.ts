import { prisma } from "@/shared/libs/prisma";
import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IDeudaRepository,
  DatosCrearDeuda,
  DeudaConRelaciones,
} from "./IDeudaRepository";

export class PrismaDeudaRepository implements IDeudaRepository {
  async crearMuchas(
    data: DatosCrearDeuda[],
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.deuda.createMany({ data });
  }

  async marcarComoSaldadas(
    idGrupo: string,
    idDeudor: string,
    idAcreedor: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.deuda.updateMany({
      where: { idGrupo, idDeudor, idAcreedor, saldada: false },
      data: { saldada: true },
    });
  }

  async obtenerPendientes(
    idUsuario: string,
    idGrupo?: string,
  ): Promise<DeudaConRelaciones[]> {
    return prisma.deuda.findMany({
      where: {
        saldada: false,
        ...(idGrupo ? { idGrupo } : {}),
        OR: [{ idDeudor: idUsuario }, { idAcreedor: idUsuario }],
      },
      include: {
        deudor: { select: { id: true, nombre: true, correo: true } },
        acreedor: { select: { id: true, nombre: true, correo: true } },
        grupo: { select: { id: true, nombre: true } },
      },
    });
  }

  async obtenerTodasPorGrupo(idGrupo: string): Promise<DeudaConRelaciones[]> {
    return prisma.deuda.findMany({
      where: {
        idGrupo,
        saldada: false,
      },
      include: {
        deudor: { select: { id: true, nombre: true, correo: true } },
        acreedor: { select: { id: true, nombre: true, correo: true } },
        grupo: { select: { id: true, nombre: true } },
      },
    });
  }

  async obtenerTodasPorGrupoIncluyendoSaldadas(
    idGrupo: string,
  ): Promise<DeudaConRelaciones[]> {
    return prisma.deuda.findMany({
      where: { idGrupo },
      include: {
        deudor: { select: { id: true, nombre: true, correo: true } },
        acreedor: { select: { id: true, nombre: true, correo: true } },
        grupo: { select: { id: true, nombre: true } },
      },
    });
  }

  async obtenerPorId(id: string): Promise<DeudaConRelaciones | null> {
    return prisma.deuda.findUnique({
      where: { id },
      include: {
        deudor: { select: { id: true, nombre: true, correo: true } },
        acreedor: { select: { id: true, nombre: true, correo: true } },
        grupo: { select: { id: true, nombre: true } },
      },
    });
  }

  async actualizarEstado(
    id: string,
    estado: string,
    pagadaEn?: Date | null,
  ): Promise<void> {
    const data: Prisma.DeudaUpdateInput = { estado };
    if (pagadaEn !== undefined) data.pagadaEn = pagadaEn;
    await prisma.deuda.update({ where: { id }, data });
  }
}
