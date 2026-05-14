import { NextRequest, NextResponse } from 'next/server';
import { procesarLogin } from '@/backend/services/login/login.service';
import { validarInicioSesion } from '@/shared/validaciones/autenticacion';
import { crearDependencias } from '@/backend/di/crearDependencias';

export async function controladorLogin(req: NextRequest) {
  try {
    const cuerpo = await req.json();
    const errores = validarInicioSesion(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos' }, { status: 400 });
    }

    const { usuarioRepo, sesionRepo } = crearDependencias();
    const resultado = await procesarLogin(cuerpo.correo, cuerpo.contrasena, usuarioRepo, sesionRepo);

    const respuesta = NextResponse.json({
      exito: true, mensaje: 'Sesión iniciada',
      datos: { accessToken: resultado.accessToken, usuario: resultado.usuario },
    }, { status: 200 });

    respuesta.cookies.set('refreshToken', resultado.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message || 'Error en el servidor' }, { status: 401 });
  }
}
