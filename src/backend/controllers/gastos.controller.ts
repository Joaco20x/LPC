import { NextRequest, NextResponse } from 'next/server';
import { procesarRegistroGasto } from '@/backend/services/gastos/gastos.service';
import { validarRegistroGasto } from '@/shared/validaciones/gastos';

export async function controladorGasto(req: NextRequest) {
  try {
    const cuerpo = await req.json();
    const errores = validarRegistroGasto(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json({ exito: false, mensaje: errores[0].mensaje }, { status: 400 });
    }

    const idGasto = await procesarRegistroGasto(cuerpo);

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
