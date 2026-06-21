import { NextRequest, NextResponse } from 'next/server';
import { refrescarToken } from '@/auth/services/refresh.service';
import { crearDependencias } from '@/shared/di/crearDependencias';

export async function controladorRefresh(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ exito: false, mensaje: 'No autorizado' }, { status: 401 });
    }

    const { sesionRepo } = crearDependencias();
    const tokens = await refrescarToken(refreshToken, sesionRepo);

    const respuesta = NextResponse.json({ exito: true, accessToken: tokens.accessToken }, { status: 200 });

    respuesta.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch {
    return NextResponse.json({ exito: false, mensaje: 'Sesión inválida o expirada' }, { status: 401 });
  }
}
