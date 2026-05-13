// Controlador de gastos
// Verifica token → valida datos → delega al servicio

import { NextRequest, NextResponse } from 'next/server';
import { registrarGasto, obtenerGastos, obtenerOpcionesFormulario } from '@/backend/services/gasto/gasto.service';
import { validarGasto } from '@/shared/validaciones/gasto';
import { verificarAccessToken } from '@/backend/auth/jwt';

function extraerPayload(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ exito: false, mensaje: 'No autorizado' }, { status: 401 }) };
  }
  try {
    const payload = verificarAccessToken(authHeader.split(' ')[1]);
    return { payload };
  } catch {
    return { error: NextResponse.json({ exito: false, mensaje: 'Token inválido o expirado' }, { status: 401 }) };
  }
}

export async function controladorCrearGasto(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const errores = validarGasto(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: 'Datos inválidos', errores }, { status: 400 });
    }

    const nuevoGasto = await registrarGasto({
      ...cuerpo,
      idPagador: cuerpo.idPagador || payload!.idUsuario,
    });

    return NextResponse.json(
      { exito: true, mensaje: 'Gasto registrado correctamente', datos: nuevoGasto },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message }, { status: 500 });
  }
}

export async function controladorObtenerGastos(req: NextRequest) {
  try {
    const { error } = extraerPayload(req);
    if (error) return error;

    const gastos = await obtenerGastos();
    return NextResponse.json({ exito: true, datos: gastos }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message }, { status: 500 });
  }
}

export async function controladorObtenerOpciones(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const opciones = await obtenerOpcionesFormulario(payload!.idUsuario);
    return NextResponse.json({ exito: true, datos: opciones }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message }, { status: 500 });
  }
}
