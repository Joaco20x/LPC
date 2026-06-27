import { prisma } from "@/shared/libs/prisma";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IDeudaRepository,
  DatosCrearDeuda,
  DeudaConRelaciones,
} from "./IDeudaRepository";

export class PrismaDeudaRepository implements IDeudaRepository {
  async crearMuchas(data: DatosCrearDeuda[], tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.deuda.createMany({ data });
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
}
