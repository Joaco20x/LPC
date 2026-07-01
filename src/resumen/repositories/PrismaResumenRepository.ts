import { prisma } from "@/shared/libs/prisma";
import type {
  IResumenRepository,
  DatosCrearResumen,
  ResumenMensualPayload,
} from "./IResumenRepository";

export class PrismaResumenRepository implements IResumenRepository {
  async crear(data: DatosCrearResumen): Promise<ResumenMensualPayload> {
    return prisma.resumenMensual.create({
      data: {
        idGrupo: data.idGrupo,
        mes: data.mes,
        anio: data.anio,
        totalGastos: data.totalGastos,
        datosJson: data.datosJson,
      },
    });
  }

  async obtenerPorGrupoYMes(
    idGrupo: string,
    mes: number,
    anio: number,
  ): Promise<ResumenMensualPayload | null> {
    return prisma.resumenMensual.findUnique({
      where: {
        idGrupo_mes_anio: {
          idGrupo,
          mes,
          anio,
        },
      },
    });
  }

  async obtenerHistorialPorGrupo(
    idGrupo: string,
  ): Promise<ResumenMensualPayload[]> {
    return prisma.resumenMensual.findMany({
      where: { idGrupo },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });
  }
}
