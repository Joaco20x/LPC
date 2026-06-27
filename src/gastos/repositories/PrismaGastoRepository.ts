import { prisma } from "@/shared/libs/prisma";
import type { Gasto } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IGastoRepository,
  DatosCrearGasto,
  GastoConRelaciones,
} from "./IGastoRepository";

export class PrismaGastoRepository implements IGastoRepository {
  async crear(data: DatosCrearGasto, tx?: TransactionClient): Promise<Gasto> {
    const client = tx ?? prisma;
    return client.gasto.create({ data });
  }
  async obtenerTodos(): Promise<GastoConRelaciones[]> {
    return prisma.gasto.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        pagador: { select: { id: true, nombre: true } },
        grupo: { select: { id: true, nombre: true } },
        divisiones: {
          include: { usuario: { select: { id: true, nombre: true } } },
        },
      },
    });
  }
  async obtenerPorId(id: string): Promise<GastoConRelaciones | null> {
    return prisma.gasto.findUnique({
      where: { id },
      include: {
        pagador: { select: { id: true, nombre: true } },
        grupo: { select: { id: true, nombre: true } },
        divisiones: {
          include: { usuario: { select: { id: true, nombre: true } } },
        },
      },
    });
  }
}
