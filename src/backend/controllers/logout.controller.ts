import { NextRequest, NextResponse } from 'next/server';
import { terminarSesion } from '@/backend/services/logout/logout.service';

export async function controladorLogout(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      await terminarSesion(refreshToken);
    }

    const respuesta = NextResponse.json({ exito: true, mensaje: 'Sesión cerrada' }, { status: 200 });
    respuesta.cookies.set('refreshToken', '', { maxAge: 0 });
    return respuesta;
  } catch (error) {
    return NextResponse.json({ exito: false, mensaje: 'Error al cerrar sesión' }, { status: 500 });
  }
}