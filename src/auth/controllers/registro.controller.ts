import { NextRequest, NextResponse } from 'next/server';
import { crearNuevoUsuario } from '@/auth/services/registro.service';
import { validarRegistro } from '@/auth/validaciones/autenticacion';
import { crearDependencias } from '@/shared/di/crearDependencias';

export async function controladorRegistro(req: NextRequest) {
  try {
    const cuerpo = await req.json();
    const errores = validarRegistro(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos', errores }, { status: 400 });
    }

    const { usuarioRepo, sesionRepo } = crearDependencias();
    const resultado = await crearNuevoUsuario(cuerpo, usuarioRepo, sesionRepo);

    const respuesta = NextResponse.json({
      exito: true, mensaje: 'Usuario registrado correctamente',
      datos: { accessToken: resultado.accessToken, usuario: resultado.usuario },
    }, { status: 201 });

    respuesta.cookies.set('refreshToken', resultado.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message || 'Error en el servidor' }, { status: 400 });
  }
}
