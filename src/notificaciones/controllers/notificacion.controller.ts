import { NextRequest, NextResponse } from "next/server";
import {
  obtenerNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "@/notificaciones/services/notificacion.service";
import { verificarAccessToken } from "@/auth/services/jwt";
import { crearDependencias } from "@/shared/di/crearDependencias";

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
    return { payload: verificarAccessToken(authHeader.split(" ")[1]) };
  } catch {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "Token inválido o expirado" },
        { status: 401 },
      ),
    };
  }
}

// GET /api/notificaciones — lista de notificaciones del usuario
export async function controladorObtenerNotificaciones(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { notificacionRepo } = crearDependencias();
    const notificaciones = await obtenerNotificaciones(
      payload!.idUsuario,
      notificacionRepo,
    );

    return NextResponse.json(
      { exito: true, datos: notificaciones },
      { status: 200 },
    );
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

// PATCH /api/notificaciones — marcar TODAS como leídas
export async function controladorMarcarTodasLeidas(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { notificacionRepo } = crearDependencias();
    await marcarTodasLeidas(payload!.idUsuario, notificacionRepo);

    return NextResponse.json(
      { exito: true, mensaje: "Notificaciones marcadas como leídas" },
      { status: 200 },
    );
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

// PATCH /api/notificaciones/[id] — marcar UNA como leída
export async function controladorMarcarUnaLeida(req: NextRequest, id: string) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { notificacionRepo } = crearDependencias();
    await marcarLeida(id, payload!.idUsuario, notificacionRepo);

    return NextResponse.json(
      { exito: true, mensaje: "Notificación marcada como leída" },
      { status: 200 },
    );
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}
