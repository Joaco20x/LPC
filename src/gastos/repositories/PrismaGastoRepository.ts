import { prisma } from "@/shared/libs/prisma";
import type { Gasto } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
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
  async crear(data: DatosCrearGasto, tx?: TransactionClient): Promise<Gasto> {
    const client = tx ?? prisma;
    return client.gasto.create({ data });
  }

  async obtenerTodos(): Promise<GastoConRelaciones[]> {
    return prisma.gasto.findMany({
      orderBy: { creadoEn: "desc" },
<<<<<<< HEAD
      include: INCLUDE_RELACIONES,
    }) as Promise<GastoConRelaciones[]>;
=======
      include: {
        pagador: { select: { id: true, nombre: true } },
        grupo: { select: { id: true, nombre: true } },
        divisiones: {
          include: { usuario: { select: { id: true, nombre: true } } },
        },
      },
    });
>>>>>>> origin/testing
  }

  async obtenerPorId(id: string): Promise<GastoConRelaciones | null> {
    return prisma.gasto.findUnique({
      where: { id },
<<<<<<< HEAD
      include: INCLUDE_RELACIONES,
    }) as Promise<GastoConRelaciones | null>;
=======
      include: {
        pagador: { select: { id: true, nombre: true } },
        grupo: { select: { id: true, nombre: true } },
        divisiones: {
          include: { usuario: { select: { id: true, nombre: true } } },
        },
      },
    });
>>>>>>> origin/testing
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
