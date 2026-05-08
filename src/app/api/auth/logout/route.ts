// POST /api/auth/logout — FR-01
// Lee el refreshToken desde la cookie httpOnly, lo invalida en BD
// y borra la cookie del cliente

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/bd/prisma';
import { respuestaErrorServidor } from '@/lib/api/respuestas';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Eliminar sesión de la BD (si no existe simplemente no hace nada)
      await prisma.sesion.deleteMany({ where: { tokenHash: refreshToken } });
    }

    const respuesta = NextResponse.json(
      { exito: true, mensaje: 'Sesión cerrada correctamente' },
      { status: 200 }
    );

    // Borrar la cookie del cliente
    respuesta.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return respuesta;
  } catch (error) {
    console.error('[POST /api/auth/logout]', error);
    return respuestaErrorServidor();
  }
}