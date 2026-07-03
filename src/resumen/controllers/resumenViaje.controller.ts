import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import { PrismaGastoRepository } from "@/gastos/repositories/PrismaGastoRepository";
import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";
import { PrismaDeudaRepository } from "@/deudas/repositories/PrismaDeudaRepository";
import { PrismaMiembroGrupoRepository } from "@/grupos/repositories/PrismaMiembroGrupoRepository";
import { obtenerResumenViaje } from "../services/resumenViaje.service";

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

export async function controladorObtenerResumenViaje(
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

    const gastoRepo = new PrismaGastoRepository();
    const deudaRepo = new PrismaDeudaRepository();

    const resumen = await obtenerResumenViaje(
      id,
      gastoRepo,
      grupoRepo,
      deudaRepo,
    );

    return NextResponse.json({
      exito: true,
      datos: resumen,
    });
  } catch (error: unknown) {
    console.error("[Resumen Viaje]", error);
    return NextResponse.json(
      { exito: false, mensaje: "Error al obtener resumen del viaje" },
      { status: 500 },
    );
  }
}
