// src/invitaciones/controllers/invitacion.controller.ts

import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import { crearDependencias } from "@/shared/di/crearDependencias";
import {
  crearInvitacion,
  aceptarInvitacion,
  obtenerInvitacionesGrupo,
  verificarTokenInvitacion,
} from "@/invitaciones/services/invitacion.service";

// ── Helper: extraer payload del token Bearer ──────────────────────────────────
function extraerPayload(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      ),
    };
  }
  try {
    const payload = verificarAccessToken(authHeader.split(" ")[1]);
    return { payload };
  } catch {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "Token inválido o expirado" },
        { status: 401 },
      ),
    };
  }
}

// ── POST /api/grupos/[id]/invitaciones ────────────────────────────────────────
export async function controladorCrearInvitacion(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const { tipo, correoInvitado, expiraHoras = 24 } = cuerpo;

    if (!tipo || !["correo", "enlace", "qr"].includes(tipo)) {
      return NextResponse.json(
        {
          exito: false,
          mensaje: "Tipo de invitación inválido. Use: correo, enlace o qr",
        },
        { status: 400 },
      );
    }
    if (tipo === "correo" && !correoInvitado) {
      return NextResponse.json(
        {
          exito: false,
          mensaje: "Se requiere correoInvitado para invitaciones por correo",
        },
        { status: 400 },
      );
    }
    if (
      typeof expiraHoras !== "number" ||
      expiraHoras < 1 ||
      expiraHoras > 720
    ) {
      return NextResponse.json(
        {
          exito: false,
          mensaje: "expiraHoras debe ser un número entre 1 y 720",
        },
        { status: 400 },
      );
    }

    const deps = crearDependencias();
    const resultado = await crearInvitacion(
      {
        idGrupo: params.id,
        idInvitador: payload!.idUsuario,
        tipo,
        correoInvitado,
        expiraHoras,
      },
      deps.invitacionRepo,
      deps.grupoRepo,
      deps.miembroGrupoRepo,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Invitación creada correctamente",
        datos: resultado,
      },
      { status: 201 },
    );
  } catch (err: any) {
    const estado =
      err.message === "Grupo no encontrado"
        ? 404
        : err.message === "Solo los administradores pueden crear invitaciones"
          ? 403
          : 500;
    return NextResponse.json(
      { exito: false, mensaje: err.message || "Error interno" },
      { status: estado },
    );
  }
}

// ── GET /api/grupos/[id]/invitaciones ─────────────────────────────────────────
export async function controladorObtenerInvitaciones(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const deps = crearDependencias();
    const invitaciones = await obtenerInvitacionesGrupo(
      params.id,
      payload!.idUsuario,
      deps.invitacionRepo,
      deps.grupoRepo,
    );

    return NextResponse.json(
      { exito: true, datos: { invitaciones } },
      { status: 200 },
    );
  } catch (err: any) {
    const estado = err.message.includes("administradores")
      ? 403
      : err.message === "Grupo no encontrado"
        ? 404
        : 500;
    return NextResponse.json(
      { exito: false, mensaje: err.message || "Error interno" },
      { status: estado },
    );
  }
}

// ── GET /api/invitaciones/[token] (público) ───────────────────────────────────
export async function controladorVerificarToken(
  req: NextRequest,
  params: { token: string },
) {
  try {
    const deps = crearDependencias();
    const resultado = await verificarTokenInvitacion(
      params.token,
      deps.invitacionRepo,
      deps.grupoRepo,
    );

    return NextResponse.json(
      { exito: true, datos: resultado },
      { status: 200 },
    );
  } catch (err: any) {
    const estado = err.message === "Invitación no encontrada" ? 404 : 500;
    return NextResponse.json(
      { exito: false, mensaje: err.message || "Error interno" },
      { status: estado },
    );
  }
}

// ── POST /api/invitaciones/[token]/aceptar (requiere auth) ───────────────────
export async function controladorAceptarInvitacion(
  req: NextRequest,
  params: { token: string },
) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const deps = crearDependencias();
    const resultado = await aceptarInvitacion(
      params.token,
      payload!.idUsuario,
      deps.invitacionRepo,
      deps.miembroGrupoRepo,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "¡Te has unido al grupo exitosamente!",
        datos: resultado,
      },
      { status: 200 },
    );
  } catch (err: any) {
    const mensaje = err.message || "Error al aceptar la invitación";
    const estado =
      mensaje.includes("expirado") || mensaje.includes("utilizada")
        ? 410
        : mensaje.includes("miembro")
          ? 409
          : mensaje === "Invitación no encontrada"
            ? 404
            : 500;
    return NextResponse.json({ exito: false, mensaje }, { status: estado });
  }
}
