import { prisma } from '@/backend/db/prisma';
import { hashearContrasena } from '@/backend/auth/contraseña';
import { generarTokens } from '@/backend/auth/jwt';

const DIAS_REFRESH = 7;

interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
}

export async function crearNuevoUsuario({ nombre, correo, contrasena }: DatosRegistro) {
  const usuarioExistente = await prisma.usuario.findUnique({ where: { correo } });
  
  if (usuarioExistente) {
    throw new Error('Este correo ya está registrado');
  }

  const contrasenaHash = await hashearContrasena(contrasena);

  const nuevoUsuario = await prisma.usuario.create({
    data: { nombre, correo, contrasenaHash, verificado: false },
    select: { id: true, nombre: true, correo: true, verificado: true, creadoEn: true },
  });

  const tokens = generarTokens({ idUsuario: nuevoUsuario.id, correo: nuevoUsuario.correo });

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

  await prisma.sesion.create({
    data: {
      idUsuario: nuevoUsuario.id,
      tokenHash: tokens.refreshToken,
      expiraEn,
    },
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: nuevoUsuario,
  };
}