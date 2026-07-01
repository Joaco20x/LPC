import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

export interface DatosCrearGrupo {
  nombre: string;
  destino: string;
  fechaInicio: Date;
  fechaFin: Date;
  monedaBase: string;
}

export type GrupoConDetalles = Prisma.GrupoGetPayload<{
  include: {
    miembros: {
      include: {
        usuario: { select: { id: true; nombre: true; correo: true } };
      };
    };
    gastos: {
      orderBy: { creadoEn: "desc" };
      include: {
        pagador: { select: { id: true; nombre: true } };
        divisiones: {
          include: { usuario: { select: { id: true; nombre: true } } };
        };
      };
    };
  };
}>;

export type GrupoActivoPayload = Prisma.GrupoGetPayload<{
  include: { miembros: true };
}>;

export interface IGrupoRepository {
  crear(data: DatosCrearGrupo, tx?: TransactionClient): Promise<{ id: string }>;
  obtenerDetalle(id: string): Promise<GrupoConDetalles | null>;
  obtenerTodosActivos(): Promise<GrupoActivoPayload[]>;
}
