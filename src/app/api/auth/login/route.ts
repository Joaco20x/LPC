// POST /api/auth/login — FR-01
// Autentica usuario con correo y contraseña, retorna JWT
// El refreshToken se envía como cookie httpOnly (no accesible desde JS)
// El accessToken se retorna en el body para que el cliente lo guarde en memoria

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/bd/prisma';
import { verificarContrasena } from '@/lib/auth/contraseña';
import { generarTokens } from '@/lib/auth/jwt';
import { validarInicioSesion } from '@/lib/validaciones/autenticacion';
import {
  respuestaNoAutorizado,
  respuestaErrorServidor,
} from '@/lib/api/respuestas';

const DIAS_REFRESH = 7;

export async function POST(req: NextRequest) {
  try {
    const cuerpo = await req.json();

    const errores = validarInicioSesion(cuerpo);
    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos' }, { status: 400 });
    }

    const { correo, contrasena } = cuerpo;

    const usuario = await prisma.usuario.findUnique({ where: { correo } });

    const mensajeInvalido = 'Correo o contraseña incorrectos';

    if (!usuario || !usuario.contrasenaHash) {
      return respuestaNoAutorizado(mensajeInvalido);
    }

    const contrasenaValida = await verificarContrasena(contrasena, usuario.contrasenaHash);
    if (!contrasenaValida) {
      return respuestaNoAutorizado(mensajeInvalido);
    }

    const tokens = generarTokens({ idUsuario: usuario.id, correo: usuario.correo });

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

    await prisma.sesion.create({
      data: {
        idUsuario: usuario.id,
        tokenHash: tokens.refreshToken,
        expiraEn,
      },
    });

    // Construir respuesta y adjuntar cookie httpOnly
    const respuesta = NextResponse.json(
      {
        exito: true,
        mensaje: 'Sesión iniciada',
        datos: {
          accessToken: tokens.accessToken,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            verificado: usuario.verificado,
          },
        },
      },
      { status: 200 }
    );

    respuesta.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * DIAS_REFRESH, // segundos
    });

    return respuesta;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return respuestaErrorServidor();
  }
}