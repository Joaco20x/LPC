import { NextRequest, NextResponse } from "next/server";
import { generarResumenesMensuales } from "../services/cronResumen.service";
import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";
import { PrismaGastoRepository } from "@/gastos/repositories/PrismaGastoRepository";
import { PrismaResumenRepository } from "../repositories/PrismaResumenRepository";
import { PrismaNotificacionRepository } from "@/notificaciones/repositories/PrismaNotificacionRepository";

export async function controladorCronResumen(req: NextRequest) {
  // Opcional: Proteger con un token secreto (ej: Vercel Cron Secret)
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { exito: false, mensaje: "No autorizado" },
      { status: 401 },
    );
  }

  try {
    const grupoRepo = new PrismaGrupoRepository();
    const gastoRepo = new PrismaGastoRepository();
    const resumenRepo = new PrismaResumenRepository();
    const notificacionRepo = new PrismaNotificacionRepository();

    const resultado = await generarResumenesMensuales(
      grupoRepo,
      gastoRepo,
      resumenRepo,
      notificacionRepo,
    );

    return NextResponse.json({
      exito: true,
      mensaje: "Resúmenes generados correctamente",
      datos: resultado,
    });
  } catch (error: unknown) {
    console.error("[CRON Resumen Mensual]", error);
    return NextResponse.json(
      { exito: false, mensaje: "Error interno al generar resúmenes" },
      { status: 500 },
    );
  }
}
