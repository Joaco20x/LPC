import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import {
  obtenerDeudasPendientes,
  pagarDeuda,
} from "@/deudas/services/deudas.service";
import { crearDependencias } from "@/shared/di/crearDependencias";

function autorizar(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verificarAccessToken(authHeader.split(" ")[1]);
}

export async function controladorDeudas(req: NextRequest) {
  try {
    const payload = autorizar(req);
    if (!payload)
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

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

export async function controladorObtenerDeuda(
  _req: NextRequest,
  params: { id: string },
) {
  try {
    const { deudaRepo } = crearDependencias();
    const deuda = await deudaRepo.obtenerPorId(params.id);
    if (!deuda)
      return NextResponse.json(
        { exito: false, mensaje: "Deuda no encontrada" },
        { status: 404 },
      );

    const deudaItem = {
      id: deuda.id,
      monto: Number(deuda.monto),
      estado: deuda.estado,
      saldada: deuda.saldada,
      actualizadoEn: deuda.actualizadoEn,
      grupo: deuda.grupo,
      deudor: deuda.deudor,
      acreedor: deuda.acreedor,
    };

    return NextResponse.json(
      { exito: true, datos: deudaItem },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorPagarDeuda(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const payload = autorizar(req);
    if (!payload)
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

    const { deudaRepo } = crearDependencias();
    await pagarDeuda(params.id, payload.idUsuario, deudaRepo);

    return NextResponse.json(
      { exito: true, mensaje: "Deuda marcada como pagada" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    let estado = 500;
    if (mensaje === "Deuda no encontrada") estado = 404;
    else if (mensaje.includes("Solo el deudor")) estado = 403;
    else if (mensaje.includes("ya está pagada")) estado = 409;
    return NextResponse.json({ exito: false, mensaje }, { status: estado });
  }
}
