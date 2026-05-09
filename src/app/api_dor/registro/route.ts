import { NextRequest } from 'next/server';
import { controladorRegistro } from '@/backend/controllers/registro.controller';

export async function POST(req: NextRequest) {
  return await controladorRegistro(req);
}