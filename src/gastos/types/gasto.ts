// Tipos compartidos para el módulo de gastos
// Refleja el schema Prisma: Gasto + DivisionGasto

export const MONEDA_DEFAULT = "CLP";

export const MONEDAS = [
  "CLP", "USD", "EUR", "ARS", "MXN", "PEN", "COP", "BRL", "GBP",
] as const;

export type Moneda = (typeof MONEDAS)[number];

const MONEDAS_SET = new Set<string>(MONEDAS);

export function esMonedaValida(valor: string): valor is Moneda {
  return MONEDAS_SET.has(valor);
}

export interface DivisionGastoInput {
  idUsuario: string;
  montoAsignado: number;
  tipoDivision: "igual" | "exacto" | "porcentaje";
  moneda?: string;
}

export interface DatosGasto {
  idGrupo?: string | null;
  idPagador?: string | null;
  monto?: number | null;
  moneda?: string;
  descripcion?: string | null;
  categoria?: string | null;
  urlBoleta?: string | null;
  divisiones?: DivisionGastoInput[];
}

export interface GastoConDetalles {
  id: string;
  idGrupo: string;
  idPagador: string;
  monto: number | string;
  moneda: string;
  descripcion: string;
  categoria: string;
  urlBoleta: string | null;
  creadoEn: Date;
  pagador: {
    id: string;
    nombre: string;
  };
  grupo: {
    id: string;
    nombre: string;
  };
  divisiones: {
    id: string;
    idUsuario: string;
    montoAsignado: number | string;
    tipoDivision: string;
    moneda: string;
    usuario: {
      id: string;
      nombre: string;
    };
  }[];
}

export interface ErrorCampoGasto {
  campo: string;
  mensaje: string;
}

export interface OpcionesFormulario {
  grupos: { id: string; nombre: string; monedaBase: string }[];
  miembros: { id: string; nombre: string }[];
}
