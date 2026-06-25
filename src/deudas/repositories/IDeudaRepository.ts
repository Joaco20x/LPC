import type { Prisma } from "@prisma/client";

export interface DatosCrearDeuda {
  idGrupo: string;
  idDeudor: string;
  idAcreedor: string;
  monto: number;
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
  crearMuchas(data: DatosCrearDeuda[], tx?: unknown): Promise<void>;
  obtenerPendientes(
    idUsuario: string,
    idGrupo?: string,
  ): Promise<DeudaConRelaciones[]>;
  obtenerTodasPorGrupo(idGrupo: string): Promise<DeudaConRelaciones[]>;
}
