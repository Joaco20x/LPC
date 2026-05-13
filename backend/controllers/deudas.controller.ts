// backend/controllers/deudas.controller.ts
// Valida el accessToken y delega al service de deudas
// Patrón idéntico al resto de controllers del proyecto

import { NextRequest, NextResponse } from 'next/server';
import { verificarAccessToken } from '@/backend/auth/jwt';
import { obtenerDeudasPendientes } from '@/backend/services/deudas/deudas.service';

export async function controladorDeudas(req: NextRequest) {
    try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
        { exito: false, mensaje: 'No autorizado' },
        { status: 401 }
        );
    }

    const token   = authHeader.split(' ')[1];
    const payload = verificarAccessToken(token);

    const deudas = await obtenerDeudasPendientes(payload.idUsuario);

    return NextResponse.json(
        { exito: true, mensaje: 'Deudas pendientes obtenidas', datos: deudas },
        { status: 200 }
    );
    } catch (error: any) {
    return NextResponse.json(
        { exito: false, mensaje: error.message || 'Error en el servidor' },
        { status: 500 }
    );
    }
}