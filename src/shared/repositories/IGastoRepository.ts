import type { Gasto, Prisma } from '@prisma/client';

export interface DatosCrearGasto {
  idGrupo: string;
  idPagador: string;
  monto: number;
  descripcion: string;
  categoria: string;
  urlBoleta: string | null;
}

export type GastoConRelaciones = Prisma.GastoGetPayload<{
  include: {
    pagador: { select: { id: true; nombre: true } };
    grupo: { select: { id: true; nombre: true } };
    divisiones: { include: { usuario: { select: { id: true; nombre: true } } } };
  };
}>;

export interface IGastoRepository {
  crear(data: DatosCrearGasto, tx?: unknown): Promise<Gasto>;
  obtenerTodos(): Promise<GastoConRelaciones[]>;
  obtenerPorId(id: string): Promise<GastoConRelaciones | null>;
}
