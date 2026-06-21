import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import { obtenerDeudasPendientes } from "@/deudas/services/deudas.service";
import { crearDependencias } from "@/shared/di/crearDependencias";

export async function controladorDeudas(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verificarAccessToken(token);
    const idGrupo = req.nextUrl.searchParams.get("grupo") || undefined;

    const { deudaRepo } = crearDependencias();
    const deudas = await obtenerDeudasPendientes(
      payload.idUsuario,
      deudaRepo,
      idGrupo,
    );

    return NextResponse.json(
      { exito: true, mensaje: "Deudas pendientes obtenidas", datos: deudas },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}
