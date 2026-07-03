import type {
  VotacionConDetalle,
  DatosCrearVotacion,
  DecisionVoto,
  ResultadoVotacion,
} from "@/votaciones/types/votacion";

export interface IVotacionRepository {
  crear(data: DatosCrearVotacion): Promise<{ id: string }>;
  buscarPorId(id: string): Promise<VotacionConDetalle | null>;
  buscarPorGrupo(idGrupo: string): Promise<VotacionConDetalle[]>;
  buscarPorDeuda(idDeuda: string): Promise<VotacionConDetalle | null>;
  registrarVoto(
    idVotacion: string,
    idUsuario: string,
    decision: DecisionVoto,
  ): Promise<void>;
  resolver(idVotacion: string, resultado: ResultadoVotacion): Promise<void>;
}
