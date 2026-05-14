import { NextRequest, NextResponse } from 'next/server';
import { verificarAccessToken } from '@/backend/auth/jwt';
import { obtenerDeudasPendientes } from '@/backend/services/deudas/deudas.service';
import { crearDependencias } from '@/backend/di/crearDependencias';

export async function controladorDeudas(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ exito: false, mensaje: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verificarAccessToken(token);
    const idGrupo = req.nextUrl.searchParams.get('grupo') || undefined;

    const { deudaRepo } = crearDependencias();
    const deudas = await obtenerDeudasPendientes(payload.idUsuario, deudaRepo, idGrupo);

    return NextResponse.json({ exito: true, mensaje: 'Deudas pendientes obtenidas', datos: deudas }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ exito: false, mensaje: error.message || 'Error en el servidor' }, { status: 500 });
  }
}
