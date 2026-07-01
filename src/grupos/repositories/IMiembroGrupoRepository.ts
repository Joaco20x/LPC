import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

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
  buscarPorGrupo(
    idGrupo: string,
    tx?: TransactionClient,
  ): Promise<{ idUsuario: string }[]>;
  crearMuchas(data: DatosCrearMiembro[], tx?: TransactionClient): Promise<void>;
  buscarPorUsuario(idUsuario: string): Promise<MiembroConGrupoYConteo[]>;
  buscarMiembrosDeGrupos(idsGrupos: string[]): Promise<MiembroConUsuario[]>;
}
