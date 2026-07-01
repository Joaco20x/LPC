import type { Prisma } from "@prisma/client";

export interface DatosCrearResumen {
  idGrupo: string;
  mes: number;
  anio: number;
  totalGastos: number;
  datosJson: any;
}

export type ResumenMensualPayload = Prisma.ResumenMensualGetPayload<{}>;

export interface IResumenRepository {
  crear(data: DatosCrearResumen): Promise<ResumenMensualPayload>;
  obtenerPorGrupoYMes(
    idGrupo: string,
    mes: number,
    anio: number,
  ): Promise<ResumenMensualPayload | null>;
  obtenerHistorialPorGrupo(idGrupo: string): Promise<ResumenMensualPayload[]>;
}
