// src/invitaciones/types/invitacion.ts

export type TipoInvitacion = 'correo' | 'enlace' | 'qr';
export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'expirada';

export interface DatosCrearInvitacion {
  idGrupo: string;
  idInvitador: string;
  tipo: TipoInvitacion;
  correoInvitado?: string;
  expiraHoras: number;
}

export interface InvitacionConEstado {
  id: string;
  idGrupo: string;
  idInvitador: string | null;
  correoInvitado: string | null;
  token: string;
  tipo: string;
  expiraEn: Date;
  usado: boolean;
  creadoEn: Date;
  estado: EstadoInvitacion;
}
