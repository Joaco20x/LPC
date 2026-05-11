// Ruta API de gastos — sigue el mismo patrón que api_dor/login/route.ts

import { NextRequest } from 'next/server';
import { controladorGasto } from '@/backend/controllers/gastos.controller';

export async function POST(req: NextRequest) {
  return await controladorGasto(req);
}
