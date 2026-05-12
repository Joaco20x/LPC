import { NextRequest } from 'next/server';
import { controladorGasto } from '@/backend/controllers/gastos.controller';

export async function POST(req: NextRequest) {
  return await controladorGasto(req);
}
