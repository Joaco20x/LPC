import { NextRequest, NextResponse } from 'next/server';
import { crearNuevoUsuario } from '@/backend/services/registro/registro.service';
import { validarRegistro } from '@/shared/validaciones/autenticacion';

export async function controladorRegistro(req: NextRequest) {
  try {
    const cuerpo = await req.json();
    const errores = validarRegistro(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos' }, { status: 400 });
    }

    const resultado = await crearNuevoUsuario(cuerpo);

    const respuesta = NextResponse.json({
      exito: true,
      mensaje: 'Cuenta creada correctamente',
      datos: { accessToken: resultado.accessToken, usuario: resultado.usuario },
    }, { status: 201 });

    respuesta.cookies.set('refreshToken', resultado.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message }, { status: 409 });
  }
}