export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

export interface DatosCreacionGrupo {
  nombre: string;
  pais: string;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  monedaBase?: string;
  idCreador?: string;
  correosIntegrantes: string[];
}