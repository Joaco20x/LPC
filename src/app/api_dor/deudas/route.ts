// app/api_dor/deudas/route.ts
// GET /api_dor/deudas — Listado de deudas pendientes (0b.0.5)
// Solo recibe GET → llama controlador

import { NextRequest } from 'next/server';
import { controladorDeudas } from '@/backend/controllers/deudas.controller';

export async function GET(req: NextRequest) {
    return controladorDeudas(req);
}