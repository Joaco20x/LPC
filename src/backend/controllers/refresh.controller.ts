// src/backend/controllers/refresh.controller.ts

import { NextRequest, NextResponse } from 'next/server';
import { refrescarToken } from '@/backend/services/refresh/refresh.service';

export async function controladorRefresh(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { exito: false, mensaje: 'No hay token de refresco' },
        { status: 401 }
      );
    }

    const resultado = await refrescarToken(refreshToken);

    const respuesta = NextResponse.json({
      exito: true,
      accessToken: resultado.accessToken,
    });

    respuesta.cookies.set('refreshToken', resultado.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error: any) {
    return NextResponse.json(
      { exito: false, mensaje: error.message || 'Token inválido' },
      { status: 401 }
    );
  }
}