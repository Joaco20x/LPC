export interface DatosCrearDivision {
  idGasto: string;
  idUsuario: string;
  montoAsignado: number;
  tipoDivision: string;
}

export interface IDivisionGastoRepository {
  crearMuchas(data: DatosCrearDivision[], tx?: unknown): Promise<void>;
}
