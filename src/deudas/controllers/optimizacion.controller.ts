import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import {
  calcularBalancesYOptimizacion,
  saldarTransferenciaSugerida,
} from "@/deudas/services/optimizacionDeudas.service";
import { notificarPagoDeuda } from "@/notificaciones/services/notificacion.service";
import { crearDependencias } from "@/shared/di/crearDependencias";

export async function controladorObtenerBalancesGrupo(
  req: NextRequest,
  idGrupo: string,
) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    verificarAccessToken(token); // Valida el token (lanza error si es inválido)

    const { deudaRepo } = crearDependencias();
    const datos = await calcularBalancesYOptimizacion(idGrupo, deudaRepo);

    return NextResponse.json(
      { exito: true, mensaje: "Balances obtenidos", datos },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorSaldarTransferencia(
  req: NextRequest,
  idGrupo: string,
) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    verificarAccessToken(token);

    const body = await req.json();
    const { idDeudor, idAcreedor, monto } = body;

    if (!idDeudor || !idAcreedor || !monto) {
      return NextResponse.json(
        { exito: false, mensaje: "Faltan datos para saldar la deuda" },
        { status: 400 },
      );
    }

    const { deudaRepo, notificacionRepo, usuarioRepo, grupoRepo } =
      crearDependencias();
    await saldarTransferenciaSugerida(
      idGrupo,
      idDeudor,
      idAcreedor,
      Number(monto),
      deudaRepo,
    );

    try {
      const [deudor, grupo] = await Promise.all([
        usuarioRepo.buscarPorId(idDeudor),
        grupoRepo.obtenerDetalle(idGrupo),
      ]);
      if (deudor && grupo) {
        await notificarPagoDeuda(
          {
            idAcreedor,
            nombreDeudor: deudor.nombre,
            nombreGrupo: grupo.nombre,
            monto: Number(monto),
          },
          notificacionRepo,
        );
      }
    } catch (err_) {
      console.warn("[Notificaciones] Error no crítico:", err_);
    }

    return NextResponse.json(
      { exito: true, mensaje: "Deuda saldada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}
