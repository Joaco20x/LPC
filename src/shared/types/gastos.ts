// Tipos para el módulo de gastos (0b.0.4)
// Refleja directamente las tablas: gastos + divisiones_gasto

export type TipoDivision = 'equitativa' | 'porcentual' | 'manual';

export type CategoriaGasto =
  | 'alojamiento'
  | 'transporte'
  | 'comida'
  | 'actividad'
  | 'otro';

// ── Entrada ───────────────────────────────────────────────

export interface DivisionIntegrante {
  idUsuario: string;
  montoAsignado: number;
  porcentaje?: number; // solo en modo porcentual
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

// ── Salida ────────────────────────────────────────────────

export interface RespuestaGasto {
  exito: boolean;
  mensaje: string;
  idGasto?: string;
}

// ── Validación ────────────────────────────────────────────

export interface ErrorCampoGasto {
  campo: string;
  mensaje: string;
}

// ── UI ────────────────────────────────────────────────────

export interface IntegranteUI {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
}
