import { prisma } from "@/shared/libs/prisma";
import type { Gasto, Prisma } from "@prisma/client";
import type {
  IGastoRepository,
  DatosCrearGasto,
  GastoConRelaciones,
} from "./IGastoRepository";

export class PrismaGastoRepository implements IGastoRepository {
  async crear(data: DatosCrearGasto, tx?: unknown): Promise<Gasto> {
    const client = (tx || prisma) as Prisma.TransactionClient;
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
    }) as Promise<GastoConRelaciones[]>;
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
    }) as Promise<GastoConRelaciones | null>;
  }
}
