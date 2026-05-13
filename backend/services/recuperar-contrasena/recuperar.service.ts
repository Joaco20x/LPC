import { randomBytes } from 'crypto';
import { prisma } from '@/backend/db/prisma';

const EXPIRACION_MINUTOS_RECUPERACION = 30;

export async function iniciarRecuperacion(correo: string) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });

  if (!usuario) return; // Retornamos silenciosamente por seguridad

  await prisma.tokenRecuperacion.updateMany({
    where: { idUsuario: usuario.id, usado: false },
    data: { usado: true },
  });

  const token = randomBytes(32).toString('hex');
  const expiraEn = new Date();
  expiraEn.setMinutes(expiraEn.getMinutes() + EXPIRACION_MINUTOS_RECUPERACION);

  await prisma.tokenRecuperacion.create({
    data: {
      idUsuario: usuario.id,
      token,
      expiraEn,
    },
  });

  const urlRecuperacion = `${process.env.NEXT_PUBLIC_URL}/nueva-contrasena?token=${token}`;

  // TODO: Implementar envío de correo real
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Simulación Correo] Link de recuperación para ${correo}: ${urlRecuperacion}`);
  }
}