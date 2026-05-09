import { prisma } from '@/backend/db/prisma';
import { verificarContrasena } from '@/backend/auth/contraseña';
import { generarTokens } from '@/backend/auth/jwt';

const DIAS_REFRESH = 7;

export async function procesarLogin(correo: string, contrasena: string) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });

  if (!usuario || !usuario.contrasenaHash) {
    throw new Error('Credenciales incorrectas');
  }

  const contrasenaValida = await verificarContrasena(contrasena, usuario.contrasenaHash);
  if (!contrasenaValida) {
    throw new Error('Credenciales incorrectas');
  }

  const tokens = generarTokens({ idUsuario: usuario.id, correo: usuario.correo });

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

  await prisma.sesion.create({
    data: {
      idUsuario: usuario.id,
      tokenHash: tokens.refreshToken,
      expiraEn,
    },
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      verificado: usuario.verificado,
    },
  };
}