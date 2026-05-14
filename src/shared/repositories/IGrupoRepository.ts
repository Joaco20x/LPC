import type { Prisma } from '@prisma/client';

export interface DatosCrearGrupo {
  nombre: string;
  destino: string;
  fechaInicio: Date;
  fechaFin: Date;
  monedaBase: string;
}

export type GrupoConDetalles = Prisma.GrupoGetPayload<{
  include: {
    miembros: { include: { usuario: { select: { id: true; nombre: true; correo: true } } } };
    gastos: {
      orderBy: { creadoEn: 'desc' };
      include: {
        pagador: { select: { id: true; nombre: true } };
        divisiones: { include: { usuario: { select: { id: true; nombre: true } } } };
      };
    };
  };
}>;

export interface IGrupoRepository {
  crear(data: DatosCrearGrupo, tx?: unknown): Promise<{ id: string }>;
  obtenerDetalle(id: string): Promise<GrupoConDetalles | null>;
}
