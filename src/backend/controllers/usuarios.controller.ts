import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/db/prisma';
import { verificarAccessToken } from '@/backend/auth/jwt';

function extraerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

export async function controladorBuscarUsuario(req: NextRequest) {
  try {
    const token = extraerToken(req);
    if (!token) {
      return NextResponse.json(
        { exito: false, mensaje: 'No autorizado' },
        { status: 401 }
      );
    }

    verificarAccessToken(token);

    const { searchParams } = new URL(req.url);
    const correo = searchParams.get('correo');

    if (!correo) {
      return NextResponse.json(
        { exito: false, mensaje: 'Debes proporcionar un correo' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      select: { id: true, nombre: true, correo: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { exito: false, mensaje: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exito: true, datos: { usuario } }, { status: 200 });
  } catch (error: any) {
    const esTokenInvalido = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';
    return NextResponse.json(
      { exito: false, mensaje: esTokenInvalido ? 'Token inválido o expirado' : 'Error al buscar usuario' },
      { status: esTokenInvalido ? 401 : 500 }
    );
  }
}