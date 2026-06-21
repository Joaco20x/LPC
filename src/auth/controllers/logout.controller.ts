import { NextRequest, NextResponse } from 'next/server';
import { terminarSesion } from '@/auth/services/logout.service';
import { crearDependencias } from '@/shared/di/crearDependencias';

export async function controladorLogout(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      const { sesionRepo } = crearDependencias();
      await terminarSesion(refreshToken, sesionRepo);
    }

    const respuesta = NextResponse.json({ exito: true, mensaje: 'Sesión cerrada' }, { status: 200 });
    respuesta.cookies.set('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 });

    return respuesta;
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Error al cerrar sesión' }, { status: 500 });
  }
}
