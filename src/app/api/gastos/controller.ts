// Controlador de gastos — SRP: orquesta validación + servicio
// Responsabilidad: parsear la request, validar y llamar al servicio

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validarRegistroGasto } from '@/lib/validaciones/gastos';
import { registrarGasto } from './service';
import type { DatosRegistroGasto, RespuestaGasto } from '@/types/gastos';

export async function manejarRegistroGasto(
  req: NextRequest
): Promise<NextResponse<RespuestaGasto>> {
  // 1. Parsear body
  let datos: DatosRegistroGasto;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json(
      { exito: false, mensaje: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  // 2. Validar
  const errores = validarRegistroGasto(datos);
  if (errores.length > 0) {
    return NextResponse.json(
      { exito: false, mensaje: errores[0].mensaje },
      { status: 422 }
    );
  }

  // 3. Ejecutar lógica de negocio
  try {
    const idGasto = await registrarGasto(datos);
    return NextResponse.json(
      { exito: true, mensaje: 'Gasto registrado correctamente', idGasto },
      { status: 201 }
    );
  } catch (error) {
    console.error('[GastoController] Error al registrar gasto:', error);
    return NextResponse.json(
      { exito: false, mensaje: 'Error interno al registrar el gasto' },
      { status: 500 }
    );
  }
}
