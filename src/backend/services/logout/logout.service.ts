import { prisma } from '@/backend/db/prisma';

export async function terminarSesion(refreshToken: string) {
  await prisma.sesion.deleteMany({
    where: { tokenHash: refreshToken },
  });
}