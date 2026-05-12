import { NextRequest } from 'next/server';
import { controladorNuevaContrasena } from '@/backend/controllers/nueva-contrasena.controller';

export async function POST(req: NextRequest) {
  return await controladorNuevaContrasena(req);
}