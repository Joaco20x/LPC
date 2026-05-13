import { prisma } from '@/backend/db/prisma';
import { hashearContrasena } from '@/backend/auth/contraseña';

export async function cambiarContrasenaConToken(token: string, nuevaContrasena: string) {
  const tokenRecuperacion = await prisma.tokenRecuperacion.findFirst({
    where: {
      token,
      usado: false,
      expiraEn: { gt: new Date() },
    },
  });

  if (!tokenRecuperacion) {
    throw new Error('Token inválido');
  }

  const contrasenaHash = await hashearContrasena(nuevaContrasena);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: tokenRecuperacion.idUsuario },
      data: { contrasenaHash },
    }),
    prisma.tokenRecuperacion.update({
      where: { id: tokenRecuperacion.id },
      data: { usado: true },
    }),
    prisma.sesion.deleteMany({
      where: { idUsuario: tokenRecuperacion.idUsuario },
    }),
  ]);
}