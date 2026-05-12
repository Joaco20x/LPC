// Tipos para el módulo de gastos (0b.0.4)
// OCP: se extiende DatosRegistroGasto sin romper lo existente

export type TipoDivision = 'equitativa' | 'porcentual' | 'manual';

export type CategoriaGasto =
  | 'alojamiento'
  | 'transporte'
  | 'comida'
  | 'actividad'
  | 'otro';

export interface DivisionIntegrante {
  idUsuario: string;
  montoAsignado: number;
  porcentaje?: number;
}

export interface DatosRegistroGasto {
  idGrupo: string;
  idPagador: string;
  monto: number;
  descripcion: string;
  categoria: CategoriaGasto;
  urlBoleta?: string;
  tipoDivision: TipoDivision;
  divisiones: DivisionIntegrante[];
}

export interface RespuestaGasto {
  exito: boolean;
  mensaje: string;
  idGasto?: string;
}

export interface ErrorCampoGasto {
  campo: string;
  mensaje: string;
}

export interface IntegranteUI {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
}
