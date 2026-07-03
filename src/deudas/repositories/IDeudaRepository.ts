import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

export interface DatosCrearDeuda {
  idGrupo: string;
  idDeudor: string;
  idAcreedor: string;
  monto: number;
  moneda: string;
  saldada: boolean;
}

export type DeudaConRelaciones = Prisma.DeudaGetPayload<{
  include: {
    deudor: { select: { id: true; nombre: true; correo: true } };
    acreedor: { select: { id: true; nombre: true; correo: true } };
    grupo: { select: { id: true; nombre: true } };
  };
}>;

export interface IDeudaRepository {
  crearMuchas(data: DatosCrearDeuda[], tx?: TransactionClient): Promise<void>;
  obtenerPendientes(
    idUsuario: string,
    idGrupo?: string,
  ): Promise<DeudaConRelaciones[]>;
  obtenerTodasPorGrupo(idGrupo: string): Promise<DeudaConRelaciones[]>;
  obtenerTodasPorGrupoIncluyendoSaldadas(
    idGrupo: string,
  ): Promise<DeudaConRelaciones[]>;
  obtenerPorId(id: string): Promise<DeudaConRelaciones | null>;
  marcarComoSaldadas(
    idGrupo: string,
    idDeudor: string,
    idAcreedor: string,
    tx?: TransactionClient,
  ): Promise<void>;
  actualizarEstado(
    id: string,
    estado: string,
    pagadaEn?: Date | null,
  ): Promise<void>;
}
