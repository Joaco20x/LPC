// src/invitaciones/repositories/PrismaInvitacionRepository.ts

import { prisma } from "@/shared/libs/prisma";
import type { Invitacion } from "@prisma/client";
import type {
  IInvitacionRepository,
  DatosCrearInvitacionRepo,
} from "./IInvitacionRepository";
import type {
  InvitacionConEstado,
  EstadoInvitacion,
} from "@/invitaciones/types/invitacion";

function calcularEstado(inv: Invitacion): EstadoInvitacion {
  usado: boolean;
}): EstadoInvitacion {
  if (inv.usado) return "aceptada";
  if (new Date() > inv.expiraEn) return "expirada";
}

export class PrismaInvitacionRepository implements IInvitacionRepository {
  async crear(
    data: DatosCrearInvitacionRepo,
  ): Promise<{ id: string; token: string }> {
    const inv = await prisma.invitacion.create({
    // Usamos 'as any' ya que los campos tipo/idInvitador requieren 'prisma generate'
    const inv = await (prisma as any).invitacion.create({
      data: {
        idGrupo: data.idGrupo,
        idInvitador: data.idInvitador ?? null,
        correoInvitado: data.correoInvitado ?? null,
        token: data.token,
        tipo: data.tipo,
        expiraEn: data.expiraEn,
      },
    });
    return { id: inv.id, token: inv.token };
  }

  async buscarPorToken(token: string): Promise<InvitacionConEstado | null> {
    const inv = await prisma.invitacion.findUnique({ where: { token } });
    const inv = await (prisma as any).invitacion.findUnique({
      where: { token },
    });
    if (!inv) return null;
    return { ...inv, estado: calcularEstado(inv) };
  }

  async buscarPorGrupo(idGrupo: string): Promise<InvitacionConEstado[]> {
    const invs = await prisma.invitacion.findMany({
      where: { idGrupo },
      orderBy: { creadoEn: "desc" },
    });
    return invs.map((inv) => ({ ...inv, estado: calcularEstado(inv) }));
  }

  async marcarComoUsada(token: string): Promise<void> {
    await prisma.invitacion.update({
      where: { token },
      data: { usado: true },
    });
  }

  async invalidarPorGrupoYCorreo(
    idGrupo: string,
    correo: string,
  ): Promise<void> {
    await prisma.invitacion.updateMany({
    await (prisma as any).invitacion.updateMany({
      where: { idGrupo, correoInvitado: correo, usado: false },
      data: { usado: true },
    });
  }
}
