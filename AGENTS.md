callback
@@ -0,0 +1,6 @@
import { NextRequest } from 'next/server';
import { controladorGoogleCallback } from '@/backend/controllers/google.oauth.controller';

export async function GET(req: NextRequest) {
  return controladorGoogleCallback(req);
}



iniciar
import { controladorGoogleIniciar } from '@/backend/controllers/google.oauth.controller';

export function GET() {
  return controladorGoogleIniciar();
}


callback/page.tsx
use client';

// Página intermedia que recibe el accessToken desde el callback de Google
// y lo guarda en memoria (igual que el login normal), luego redirige al dashboard.
// Ruta: /auth/google/callback

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { guardarAccessToken, guardarDatosUsuario } from '@/shared/servicios/almacenamientoTokens';

export default function PaginaCallbackGoogle() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const error = params.get('error');

    if (error || !accessToken) {
      // Algo falló, volver al login con mensaje
      router.replace('/login?error=oauth_fallido');
      return;
    }

    // Guardar accessToken en memoria (mismo servicio que usa el login normal)
    guardarAccessToken(accessToken);

    // Guardar datos del usuario si vienen
    const id = params.get('id');
    const nombre = params.get('nombre');
    const correo = params.get('correo');
    const verificado = params.get('verificado');

    if (id && nombre && correo) {
      guardarDatosUsuario({
        id,
        nombre,
        correo,
        verificado: verificado === 'true',
      });
    }

    // Redirigir al dashboard
    router.replace('/dashboard');
  }, [params, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Iniciando sesión con Google...</p>
    </div>
  );
}



google.oauth.controllet
/ Controller OAuth Google — maneja los dos endpoints: /iniciar y /callback
// Mismo estilo que login.controller.ts y registro.controller.ts

import { NextRequest, NextResponse } from 'next/server';
import { procesarLoginGoogle } from '@/backend/services/oauth/google.service';
import { crearDependencias } from '@/backend/di/crearDependencias';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function obtenerUrlCallback() {
  return `${process.env.NEXT_PUBLIC_URL}/api_dor/auth/google/callback`;
}

// ── PASO 1: redirigir a Google ────────────────────────────────────────────────
export function controladorGoogleIniciar() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: obtenerUrlCallback(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

// ── PASO 2: recibir el code de Google y completar el login ───────────────────
export async function controladorGoogleCallback(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // El usuario canceló en Google
  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/login?error=oauth_cancelado`);
  }

  try {
    // Intercambiar code por access_token de Google
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: obtenerUrlCallback(),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('No se pudo obtener el token de Google');
    }

    const { access_token } = await tokenRes.json();

    // Obtener datos del usuario desde Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      throw new Error('No se pudieron obtener los datos del usuario de Google');
    }

    const datosGoogle = await userRes.json();

    // Procesar con el servicio (buscar o crear usuario, generar JWTs propios)
    const { usuarioRepo, sesionRepo } = crearDependencias();
    const resultado = await procesarLoginGoogle(datosGoogle, usuarioRepo, sesionRepo);

    // Redirigir al frontend con el accessToken en query param
    // El frontend lo guarda en memoria igual que en el login normal
    const urlDestino = new URL(`${process.env.NEXT_PUBLIC_URL}/auth/google/callback`);
    urlDestino.searchParams.set('accessToken', resultado.accessToken);
    urlDestino.searchParams.set('nombre', resultado.usuario.nombre);
    urlDestino.searchParams.set('correo', resultado.usuario.correo);
    urlDestino.searchParams.set('id', resultado.usuario.id);
    urlDestino.searchParams.set('verificado', String(resultado.usuario.verificado));

    const respuesta = NextResponse.redirect(urlDestino.toString());

    // Misma cookie httpOnly que usa el login normal
    respuesta.cookies.set('refreshToken', resultado.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error: any) {
    console.error('[OAuth Google]', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/login?error=oauth_fallido`
    );
  }
}


google.service
/ Service OAuth Google — sigue el mismo patrón que login.service.ts
// Busca o crea el usuario OAuth, luego genera los mismos JWT propios del proyecto

import { generarTokens } from '@/backend/auth/jwt';
import type { IUsuarioRepository } from '@/shared/repositories/IUsuarioRepository';
import type { ISesionRepository } from '@/shared/repositories/ISesionRepository';

const DIAS_REFRESH = 7;

export interface DatosUsuarioGoogle {
  id: string;
  email: string;
  name: string;
  verified_email: boolean;
}

export async function procesarLoginGoogle(
  datosGoogle: DatosUsuarioGoogle,
  usuarioRepo: IUsuarioRepository,
  sesionRepo: ISesionRepository,
) {
  // 1. Buscar por ID de proveedor OAuth (lo más directo)
  let usuario = await usuarioRepo.buscarPorOauth('google', datosGoogle.id);

  // 2. Si no existe por OAuth, intentar por correo (puede ser registro previo con email)
  if (!usuario) {
    usuario = await usuarioRepo.buscarPorCorreo(datosGoogle.email);
  }

  // 3. Si definitivamente no existe, crear cuenta nueva
  if (!usuario) {
    usuario = await usuarioRepo.crear({
      nombre: datosGoogle.name,
      correo: datosGoogle.email,
      contrasenaHash: null,           // sin contraseña: es cuenta OAuth
      proveedorOauth: 'google',
      idProveedorOauth: datosGoogle.id,
      verificado: datosGoogle.verified_email,
    });
  }

  // 4. Generar los JWT propios del proyecto (igual que login normal)
  const tokens = generarTokens({ idUsuario: usuario.id, correo: usuario.correo });

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

  await sesionRepo.crear({
    idUsuario: usuario.id,
    tokenHash: tokens.refreshToken,
    expiraEn,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      verificado: usuario.verificado,
    },
  };
}



