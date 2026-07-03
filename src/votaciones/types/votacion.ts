export type TipoVotacion = "abstencion" | "denuncia";
export type EstadoVotacion = "activa" | "resuelta";
export type DecisionVoto = "aprobar" | "rechazar";
export type ResultadoVotacion = "aprobada" | "rechazada";

export interface DatosCrearVotacion {
  idGrupo: string;
  idDeuda: string;
  idCreador: string;
  tipo: TipoVotacion;
}

export interface VotoResumen {
  idUsuario: string;
  nombreUsuario: string;
  decision: DecisionVoto;
}

export interface VotacionConDetalle {
  id: string;
  idGrupo: string;
  idDeuda: string;
  idCreador: string;
  tipo: TipoVotacion;
  estado: EstadoVotacion;
  resultado: ResultadoVotacion | null;
  creadoEn: Date;
  resueltaEn: Date | null;
  votos: VotoResumen[];
  totalMiembros: number;
  aprobaciones: number;
  rechazos: number;
  pendientes: number;
}
