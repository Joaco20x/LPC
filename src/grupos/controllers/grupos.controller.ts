import { NextRequest, NextResponse } from "next/server";
import {
  crearGrupoViaje,
  obtenerGruposDelUsuario,
  obtenerDetalleGrupo,
  actualizarPresupuestoGrupo,
} from "@/grupos/services/grupos.service";
import { validarCreacionGrupo } from "@/grupos/validaciones/grupos";
import { verificarAccessToken } from "@/auth/services/jwt";
import { crearDependencias } from "@/shared/di/crearDependencias";
import { PrismaDatabaseService } from "@/shared/libs/prismaDatabaseService";

function extraerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

function extraerPayload(req: NextRequest) {
  const token = extraerToken(req);
  if (!token)
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      ),
    };
  try {
    return { payload: verificarAccessToken(token) };
  } catch {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "Token inválido o expirado" },
        { status: 401 },
      ),
    };
  }
}

export async function controladorCrearGrupo(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const datosCompletos = { ...cuerpo, idCreador: payload.idUsuario };
    const errores = validarCreacionGrupo(datosCompletos);

    if (errores.length > 0) {
      return NextResponse.json(
        { exito: false, mensaje: "Datos inválidos", errores },
        { status: 400 },
      );
    }

    const deps = crearDependencias();
    const grupo = await crearGrupoViaje(
      datosCompletos,
      deps.usuarioRepo,
      deps.grupoRepo,
      deps.miembroGrupoRepo,
      PrismaDatabaseService,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Grupo de viaje creado correctamente",
        datos: { grupo },
      },
      { status: 201 },
    );
  } catch (error) {
    const err = error as { name?: string; message?: string };
    const esTokenInvalido =
      err.name === "JsonWebTokenError" || err.name === "TokenExpiredError";
    return NextResponse.json(
      {
        exito: false,
        mensaje: esTokenInvalido
          ? "Token inválido o expirado"
          : err.message || "Error interno al crear el grupo",
      },
      { status: esTokenInvalido ? 401 : 500 },
    );
  }
}

export async function controladorObtenerGrupos(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { miembroGrupoRepo } = crearDependencias();
    const grupos = await obtenerGruposDelUsuario(
      payload.idUsuario,
      miembroGrupoRepo,
    );

    return NextResponse.json(
      { exito: true, datos: { grupos } },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al obtener grupos";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorObtenerDetalleGrupo(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const { error } = extraerPayload(req);
    if (error) return error;

    const { grupoRepo } = crearDependencias();
    const grupo = await obtenerDetalleGrupo(params.id, grupoRepo);

    return NextResponse.json(
      { exito: true, datos: { grupo } },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al obtener detalle del grupo";
    return NextResponse.json(
      { exito: false, mensaje },
      { status: mensaje === "Grupo no encontrado" ? 404 : 500 },
    );
  }
}

// ── NUEVO: PATCH /api/grupos/[id]/presupuesto (solo Admin) ───────────────────
export async function controladorActualizarPresupuesto(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const presupuestoPorPersona =
      cuerpo.presupuestoPorPersona === null ||
      cuerpo.presupuestoPorPersona === undefined ||
      cuerpo.presupuestoPorPersona === ""
        ? null
        : Number(cuerpo.presupuestoPorPersona);
    const umbralAlerta =
      cuerpo.umbralAlerta === null ||
      cuerpo.umbralAlerta === undefined ||
      cuerpo.umbralAlerta === ""
        ? null
        : Number(cuerpo.umbralAlerta);

    const { grupoRepo } = crearDependencias();
    const resultado = await actualizarPresupuestoGrupo(
      params.id,
      payload.idUsuario,
      { presupuestoPorPersona, umbralAlerta },
      grupoRepo,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Presupuesto actualizado correctamente",
        datos: resultado,
      },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al actualizar el presupuesto";
    const esPermiso = mensaje.includes("administrador");
    const esNoEncontrado = mensaje === "Grupo no encontrado";
    const status = esPermiso ? 403 : esNoEncontrado ? 404 : 400;
    return NextResponse.json({ exito: false, mensaje }, { status });
  }
}
