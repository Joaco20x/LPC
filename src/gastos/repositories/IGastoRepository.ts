import type { Gasto, Prisma } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

export interface DatosCrearGasto {
  idGrupo: string;
  idPagador: string;
  monto: number;
  moneda: string;
  descripcion: string;
  categoria: string;
  urlBoleta: string | null;
}

export type GastoConRelaciones = Prisma.GastoGetPayload<{
  include: {
    pagador: { select: { id: true; nombre: true } };
    grupo: { select: { id: true; nombre: true } };
    divisiones: {
      include: { usuario: { select: { id: true; nombre: true } } };
    };
  };
}> & { moneda?: string; divisiones?: { moneda?: string }[] };

export interface IGastoRepository {
  crear(data: DatosCrearGasto, tx?: TransactionClient): Promise<Gasto>;
  obtenerTodos(): Promise<GastoConRelaciones[]>;
  obtenerPorId(id: string): Promise<GastoConRelaciones | null>;
  obtenerPorGrupo(idGrupo: string): Promise<GastoConRelaciones[]>; // ← NUEVO
}
