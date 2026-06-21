import { NextRequest, NextResponse } from "next/server";
import { procesarLoginGoogle } from "@/auth/services/google.service";
import { crearDependencias } from "@/shared/di/crearDependencias";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function obtenerUrlCallback() {
  return `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`;
}

export function controladorGoogleIniciar() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: obtenerUrlCallback(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export async function controladorGoogleCallback(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/login?error=oauth_cancelado`,
    );
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: obtenerUrlCallback(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("No se pudo obtener el token de Google");
    }

    const { access_token } = await tokenRes.json();

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      throw new Error("No se pudieron obtener los datos del usuario de Google");
    }

    const datosGoogle = await userRes.json();

    const { usuarioRepo, sesionRepo } = crearDependencias();
    const resultado = await procesarLoginGoogle(
      datosGoogle,
      usuarioRepo,
      sesionRepo,
    );

    const urlDestino = new URL(
      `${process.env.NEXT_PUBLIC_URL}/auth/google/callback`,
    );
    urlDestino.searchParams.set("accessToken", resultado.accessToken);
    urlDestino.searchParams.set("nombre", resultado.usuario.nombre);
    urlDestino.searchParams.set("correo", resultado.usuario.correo);
    urlDestino.searchParams.set("id", resultado.usuario.id);
    urlDestino.searchParams.set(
      "verificado",
      String(resultado.usuario.verificado),
    );

    const respuesta = NextResponse.redirect(urlDestino.toString());

    respuesta.cookies.set("refreshToken", resultado.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return respuesta;
  } catch (error) {
    console.error("[OAuth Google]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/login?error=oauth_fallido`,
    );
  }
}
