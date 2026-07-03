import { NextRequest, NextResponse } from "next/server";
import { PrismaResumenRepository } from "../repositories/PrismaResumenRepository";
import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";
import { PrismaMiembroGrupoRepository } from "@/grupos/repositories/PrismaMiembroGrupoRepository";
import { verificarAccessToken } from "@/auth/services/jwt";

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

export async function controladorObtenerResumenesPorGrupo(
  req: NextRequest,
  params: { id: string },
) {
  const { id } = params;

  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const grupoRepo = new PrismaGrupoRepository();
    const grupo = await grupoRepo.obtenerDetalle(id);

    if (!grupo) {
      return NextResponse.json(
        { exito: false, mensaje: "Grupo no encontrado" },
        { status: 404 },
      );
    }

    const miembroRepo = new PrismaMiembroGrupoRepository();
    const miembros = await miembroRepo.buscarPorGrupo(id);
    const esMiembro = miembros.some((m) => m.idUsuario === payload.idUsuario);

    if (!esMiembro) {
      return NextResponse.json(
        { exito: false, mensaje: "No perteneces a este grupo" },
        { status: 403 },
      );
    }

    const resumenRepo = new PrismaResumenRepository();
    const resumenes = await resumenRepo.obtenerHistorialPorGrupo(id);

    return NextResponse.json({
      exito: true,
      datos: resumenes,
    });
  } catch (error: unknown) {
    console.error("[Obtener Resumenes]", error);
    return NextResponse.json(
      { exito: false, mensaje: "Error al obtener resúmenes" },
      { status: 500 },
    );
  }
}
