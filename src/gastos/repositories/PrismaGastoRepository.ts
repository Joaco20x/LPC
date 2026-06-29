import { prisma } from "@/shared/libs/prisma";
import type { Gasto, Prisma } from "@prisma/client";
import type {
  IGastoRepository,
  DatosCrearGasto,
  GastoConRelaciones,
} from "./IGastoRepository";

const INCLUDE_RELACIONES = {
  pagador: { select: { id: true, nombre: true } },
  grupo: { select: { id: true, nombre: true } },
  divisiones: {
    include: { usuario: { select: { id: true, nombre: true } } },
  },
} as const;

export class PrismaGastoRepository implements IGastoRepository {
  async crear(data: DatosCrearGasto, tx?: unknown): Promise<Gasto> {
    const client = (tx || prisma) as Prisma.TransactionClient;
    return client.gasto.create({ data });
  }

  async obtenerTodos(): Promise<GastoConRelaciones[]> {
    return prisma.gasto.findMany({
      orderBy: { creadoEn: "desc" },
      include: INCLUDE_RELACIONES,
    }) as Promise<GastoConRelaciones[]>;
  }

  async obtenerPorId(id: string): Promise<GastoConRelaciones | null> {
    return prisma.gasto.findUnique({
      where: { id },
      include: INCLUDE_RELACIONES,
    }) as Promise<GastoConRelaciones | null>;
  }

  // ── NUEVO: gastos filtrados por grupo ─────────────────────────────────────
  async obtenerPorGrupo(idGrupo: string): Promise<GastoConRelaciones[]> {
    return prisma.gasto.findMany({
      where: { idGrupo },
      orderBy: { creadoEn: "desc" },
      include: INCLUDE_RELACIONES,
    }) as Promise<GastoConRelaciones[]>;
  }
}
