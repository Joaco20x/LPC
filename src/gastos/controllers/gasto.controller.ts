import { NextRequest, NextResponse } from "next/server";
import {
  registrarGasto,
  obtenerGastos,
  obtenerOpcionesFormulario,
} from "@/gastos/services/gasto.service";
import { validarGasto } from "@/gastos/validaciones/gasto";
import { verificarAccessToken } from "@/auth/services/jwt";
import { MONEDA_DEFAULT } from "@/gastos/types/gasto";
import { crearDependencias } from "@/shared/di/crearDependencias";
import { PrismaDatabaseService } from "@/shared/libs/prismaDatabaseService";

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

export async function controladorCrearGasto(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const errores = validarGasto(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json(
        { exito: false, mensaje: "Datos inválidos", errores },
        { status: 400 },
      );
    }

    const deps = crearDependencias();
    const nuevoGasto = await registrarGasto(
      {
        ...cuerpo,
        idPagador: cuerpo.idPagador || payload.idUsuario,
        moneda: cuerpo.moneda || MONEDA_DEFAULT,
      },
      deps.gastoRepo,
      deps.divisionGastoRepo,
      deps.deudaRepo,
      deps.miembroGrupoRepo,
      PrismaDatabaseService,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Gasto registrado correctamente",
        datos: nuevoGasto,
      },
      { status: 201 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorObtenerGastos(req: NextRequest) {
  try {
    const { error } = extraerPayload(req);
    if (error) return error;

    const { gastoRepo } = crearDependencias();
    const gastos = await obtenerGastos(gastoRepo);

    return NextResponse.json({ exito: true, datos: gastos }, { status: 200 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorObtenerOpciones(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { miembroGrupoRepo } = crearDependencias();
    const opciones = await obtenerOpcionesFormulario(
      payload.idUsuario,
      miembroGrupoRepo,
    );

    return NextResponse.json({ exito: true, datos: opciones }, { status: 200 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}
