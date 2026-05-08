// POST /api/auth/nueva-contrasena — FR-01
// Verifica token de recuperación y actualiza la contraseña del usuario
// Patrón: usa $transaction para garantizar atomicidad en la BD

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/bd/prisma';
import { hashearContrasena } from '@/lib/auth/contraseña';
import { validarContrasena } from '@/lib/validaciones/autenticacion';
import {
  respuestaExito,
  respuestaError,
  respuestaErrorServidor,
} from '@/lib/api/respuestas';

export async function POST(req: NextRequest) {
  try {
    const { token, contrasena } = await req.json();

    if (!token) {
      return respuestaError('Token requerido');
    }

    const errorContrasena = validarContrasena(contrasena ?? '');
    if (errorContrasena) {
      return respuestaError(errorContrasena, 422);
    }

    // Buscar token válido, no usado y no expirado
    const tokenRecuperacion = await prisma.tokenRecuperacion.findFirst({
      where: {
        token,
        usado: false,
        expiraEn: { gt: new Date() },
      },
    });

    if (!tokenRecuperacion) {
      return respuestaError('El enlace es inválido o ha expirado', 400);
    }

    const contrasenaHash = await hashearContrasena(contrasena);

    // Transacción: actualizar contraseña + marcar token usado + eliminar sesiones
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

    return respuestaExito({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[POST /api/auth/nueva-contrasena]', error);
    return respuestaErrorServidor();
  }
}