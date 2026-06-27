import type { TransactionClient } from "@/shared/libs/IDatabaseService";

export interface DatosCrearDivision {
  idGasto: string;
  idUsuario: string;
  montoAsignado: number;
  tipoDivision: string;
  moneda: string;
}

export interface IDivisionGastoRepository {
  crearMuchas(
    data: DatosCrearDivision[],
    tx?: TransactionClient,
  ): Promise<void>;
}
