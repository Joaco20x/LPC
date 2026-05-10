// Ruta API de gastos — Next.js App Router
// Responsabilidad: declarar los métodos HTTP y delegar al controlador

import type { NextRequest } from 'next/server';
import { manejarRegistroGasto } from './controller';

// POST /api/gastos — Registrar un nuevo gasto con su división
export async function POST(req: NextRequest) {
  return manejarRegistroGasto(req);
}
