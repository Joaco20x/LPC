// POST /api/auth/registro — FR-01
// Registra un nuevo usuario con correo y contraseña
// Al igual que login, setea el refreshToken como cookie httpOnly

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/bd/prisma';
import { hashearContrasena } from '@/lib/auth/contraseña';
import { generarTokens } from '@/lib/auth/jwt';
import { validarRegistro } from '@/lib/validaciones/autenticacion';
import {
  respuestaConflicto,
  respuestaErrorServidor,
} from '@/lib/api/respuestas';

const DIAS_REFRESH = 7;

export async function POST(req: NextRequest) {
  try {
    const cuerpo = await req.json();

    const errores = validarRegistro(cuerpo);
    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos' }, { status: 400 });
    }

    const { nombre, correo, contrasena } = cuerpo;

    const usuarioExistente = await prisma.usuario.findUnique({ where: { correo } });
    if (usuarioExistente) {
      return respuestaConflicto('Este correo ya está registrado');
    }

    const contrasenaHash = await hashearContrasena(contrasena);

    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre, correo, contrasenaHash, verificado: false },
      select: { id: true, nombre: true, correo: true, verificado: true, creadoEn: true },
    });

    const tokens = generarTokens({ idUsuario: nuevoUsuario.id, correo: nuevoUsuario.correo });

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

    await prisma.sesion.create({
      data: {
        idUsuario: nuevoUsuario.id,
        tokenHash: tokens.refreshToken,
        expiraEn,
      },
    });

    const respuesta = NextResponse.json(
      {
        exito: true,
        mensaje: 'Cuenta creada correctamente',
        datos: {
          accessToken: tokens.accessToken,
          usuario: nuevoUsuario,
        },
      },
      { status: 201 }
    );

    respuesta.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * DIAS_REFRESH,
    });

    return respuesta;
  } catch (error) {
    console.error('[POST /api/auth/registro]', error);
    return respuestaErrorServidor();
  }
}