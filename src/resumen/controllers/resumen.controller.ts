import { NextRequest, NextResponse } from "next/server";
import { PrismaResumenRepository } from "../repositories/PrismaResumenRepository";
import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";

export async function controladorObtenerResumenesPorGrupo(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = context.params;

  try {
    const grupoRepo = new PrismaGrupoRepository();
    const grupo = await grupoRepo.obtenerDetalle(id);

    if (!grupo) {
      return NextResponse.json(
        { exito: false, mensaje: "Grupo no encontrado" },
        { status: 404 },
      );
    }

    // TODO: Validar que el usuario autenticado pertenece al grupo.
    // Asumiremos que el middleware / frontend ya protegen esto, o se puede agregar la validación de sesión aquí.

    const resumenRepo = new PrismaResumenRepository();
    const resumenes = await resumenRepo.obtenerHistorialPorGrupo(id);

    return NextResponse.json({
      exito: true,
      datos: resumenes,
    });
  } catch (error: any) {
    console.error("[Obtener Resumenes]", error);
    return NextResponse.json(
      { exito: false, mensaje: "Error al obtener resúmenes" },
      { status: 500 },
    );
  }
}
