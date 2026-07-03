export interface DatosResumenGeneral {
  totalGastos: number;
  cantidadGastos: number;
  duracionDias: number;
  moneda: string;
}

export interface ResumenCategoria {
  categoria: string;
  monto: number;
  porcentaje: number;
}

export interface ResumenIntegrante {
  id: string;
  nombre: string;
  gastado: number;
  pagado: number;
  balance: number;
}

export interface RankingEntry {
  id: string;
  nombre: string;
  monto: number;
}

export interface DeudaResumen {
  deudor: { id: string; nombre: string };
  acreedor: { id: string; nombre: string };
  monto: number;
  moneda: string;
}

export interface ResumenViaje {
  grupo: {
    id: string;
    nombre: string;
    destino: string;
    fechaInicio: string;
    fechaFin: string;
    duracionDias: number;
    monedaBase: string;
  };
  resumenGeneral: DatosResumenGeneral;
  porCategoria: ResumenCategoria[];
  porIntegrante: ResumenIntegrante[];
  ranking: {
    mayorGasto: RankingEntry;
    mayorPagador: RankingEntry;
  };
  deudas: DeudaResumen[];
}
