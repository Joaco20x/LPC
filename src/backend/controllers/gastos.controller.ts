import { NextRequest, NextResponse } from 'next/server';
import { procesarRegistroGasto } from '@/backend/services/gastos/gastos.service';
import { validarRegistroGasto } from '@/shared/validaciones/gastos';

export async function controladorGasto(req: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json(
      { exito: false, mensaje: 'El cuerpo de la solicitud no es JSON válido' },
      { status: 400 }
    );
  }

  try {
    const errores = validarRegistroGasto(cuerpo as any);

    if (errores.length > 0) {
      return NextResponse.json(
        { exito: false, mensaje: errores.map((e) => e.mensaje).join('. ') },
        { status: 400 }
      );
    }

    const idGasto = await procesarRegistroGasto(cuerpo as any);

    return NextResponse.json(
      { exito: true, mensaje: 'Gasto registrado correctamente', idGasto },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { exito: false, mensaje: error.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}
