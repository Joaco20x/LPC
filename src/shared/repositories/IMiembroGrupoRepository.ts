import type { Prisma } from '@prisma/client';

export interface DatosCrearMiembro {
  idGrupo: string;
  idUsuario: string;
  rol: string;
}

export type MiembroConGrupoYConteo = Prisma.MiembroGrupoGetPayload<{
  include: {
    grupo: { include: { _count: { select: { miembros: true } } } };
  };
}>;

export type MiembroConUsuario = Prisma.MiembroGrupoGetPayload<{
  include: { usuario: { select: { id: true; nombre: true } } };
}>;

export interface IMiembroGrupoRepository {
  buscarPorGrupo(idGrupo: string, tx?: unknown): Promise<{ idUsuario: string }[]>;
  crearMuchas(data: DatosCrearMiembro[], tx?: unknown): Promise<void>;
  buscarPorUsuario(idUsuario: string): Promise<MiembroConGrupoYConteo[]>;
  buscarMiembrosDeGrupos(idsGrupos: string[]): Promise<MiembroConUsuario[]>;
}
