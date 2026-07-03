// src/invitaciones/repositories/IInvitacionRepository.ts

import type {
  InvitacionConEstado,
  TipoInvitacion,
} from "@/invitaciones/types/invitacion";

export interface DatosCrearInvitacionRepo {
  idGrupo: string;
  idInvitador?: string;
  correoInvitado?: string;
  token: string;
  tipo: TipoInvitacion;
  expiraEn: Date;
}

export interface IInvitacionRepository {
  crear(data: DatosCrearInvitacionRepo): Promise<{ id: string; token: string }>;
  buscarPorToken(token: string): Promise<InvitacionConEstado | null>;
  buscarPorGrupo(idGrupo: string): Promise<InvitacionConEstado[]>;
  marcarComoUsada(token: string): Promise<void>;
  invalidarPorGrupoYCorreo(idGrupo: string, correo: string): Promise<void>;
}
