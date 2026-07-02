import type { Prisma } from "@prisma/client";

export interface DatosCrearGrupo {
  nombre: string;
  destino: string;
  fechaInicio: Date;
  fechaFin: Date;
  monedaBase: string;
}

// ── NUEVO ────────────────────────────────────────────────────────────────────
export interface DatosActualizarPresupuesto {
  presupuestoPorPersona: number | null;
  umbralAlerta: number | null;
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
  crear(data: DatosCrearGrupo, tx?: unknown): Promise<{ id: string }>;
  obtenerDetalle(id: string): Promise<GrupoConDetalles | null>;
  actualizarPresupuesto(
    id: string,
    datos: DatosActualizarPresupuesto,
  ): Promise<void>; // ← NUEVO
  obtenerTodosActivos(): Promise<GrupoActivoPayload[]>;
}
