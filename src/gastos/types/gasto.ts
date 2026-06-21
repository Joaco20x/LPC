// Tipos compartidos para el módulo de gastos
// Refleja el schema Prisma: Gasto + DivisionGasto

export interface DivisionGastoInput {
  idUsuario: string;
  montoAsignado: number;
  tipoDivision: "igual" | "exacto" | "porcentaje";
}

export interface DatosGasto {
  idGrupo?: string | null;
  idPagador?: string | null;
  monto?: number | null;
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
  grupos: { id: string; nombre: string }[];
  miembros: { id: string; nombre: string }[];
}
