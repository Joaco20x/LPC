import { prisma } from "@/shared/libs/prisma";
import type { Prisma } from "@prisma/client";
import type { IVotacionRepository } from "./IVotacionRepository";
import type {
  VotacionConDetalle,
  DatosCrearVotacion,
  DecisionVoto,
  ResultadoVotacion,
} from "@/votaciones/types/votacion";

const includeVotos = {
  votos: {
    include: {
      usuario: { select: { id: true, nombre: true } },
    },
  },
  deuda: {
    include: {
      grupo: {
        include: { miembros: { select: { idUsuario: true } } },
      },
    },
  },
} satisfies Prisma.VotacionInclude;

type VotacionConIncludes = Prisma.VotacionGetPayload<{
  include: typeof includeVotos;
}>;

function mapear(v: VotacionConIncludes): VotacionConDetalle {
  const totalMiembros = v.deuda?.grupo?.miembros?.length ?? 0;
  const aprobaciones = v.votos.filter((vt) => vt.decision === "aprobar").length;
  const rechazos = v.votos.filter((vt) => vt.decision === "rechazar").length;
  return {
    id: v.id,
    idGrupo: v.idGrupo,
    idDeuda: v.idDeuda,
    idCreador: v.idCreador,
    tipo: v.tipo,
    estado: v.estado,
    resultado: v.resultado,
    creadoEn: v.creadoEn,
    resueltaEn: v.resueltaEn,
    votos: v.votos.map((vt) => ({
      idUsuario: vt.idUsuario,
      nombreUsuario: vt.usuario.nombre,
      decision: vt.decision,
    })),
    totalMiembros,
    aprobaciones,
    rechazos,
    pendientes: totalMiembros - aprobaciones - rechazos,
  };
}

export class PrismaVotacionRepository implements IVotacionRepository {
  async crear(data: DatosCrearVotacion): Promise<{ id: string }> {
    const v = await prisma.votacion.create({
      data: {
        idGrupo: data.idGrupo,
        idDeuda: data.idDeuda,
        idCreador: data.idCreador,
        tipo: data.tipo,
      },
    });
    return { id: v.id };
  }

  async buscarPorId(id: string): Promise<VotacionConDetalle | null> {
    const v = await prisma.votacion.findUnique({
      where: { id },
      include: includeVotos,
    });
    return v ? mapear(v) : null;
  }

  async buscarPorGrupo(idGrupo: string): Promise<VotacionConDetalle[]> {
    const vs = await prisma.votacion.findMany({
      where: { idGrupo },
      include: includeVotos,
      orderBy: { creadoEn: "desc" },
    });
    return vs.map(mapear);
  }

  async buscarPorDeuda(idDeuda: string): Promise<VotacionConDetalle | null> {
    const v = await prisma.votacion.findFirst({
      where: { idDeuda, estado: "activa" },
      include: includeVotos,
    });
    return v ? mapear(v) : null;
  }

  async registrarVoto(
    idVotacion: string,
    idUsuario: string,
    decision: DecisionVoto,
  ): Promise<void> {
    await prisma.votoIndividual.create({
      data: { idVotacion, idUsuario, decision },
    });
  }

  async resolver(
    idVotacion: string,
    resultado: ResultadoVotacion,
  ): Promise<void> {
    await prisma.votacion.update({
      where: { id: idVotacion },
      data: { estado: "resuelta", resultado, resueltaEn: new Date() },
    });
  }
}
