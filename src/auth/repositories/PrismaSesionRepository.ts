import { prisma } from "@/shared/libs/prisma";
import type { Sesion } from "@prisma/client";
import type { ISesionRepository, DatosCrearSesion } from "./ISesionRepository";

export class PrismaSesionRepository implements ISesionRepository {
  async crear(data: DatosCrearSesion): Promise<Sesion> {
    return prisma.sesion.create({ data });
  }
  async buscarPorTokenHash(tokenHash: string): Promise<Sesion | null> {
    return prisma.sesion.findFirst({
      where: { tokenHash, expiraEn: { gt: new Date() } },
    });
  }
  async actualizarTokenHash(id: string, nuevoHash: string): Promise<void> {
    await prisma.sesion.update({
      where: { id },
      data: { tokenHash: nuevoHash },
    });
  }
  async eliminarPorTokenHash(tokenHash: string): Promise<void> {
    await prisma.sesion.deleteMany({ where: { tokenHash } });
  }
  async eliminarPorIdUsuario(idUsuario: string): Promise<void> {
    await prisma.sesion.deleteMany({ where: { idUsuario } });
  }
}
