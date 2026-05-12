import { NextRequest } from 'next/server';
import { controladorRecuperarContrasena } from '@/backend/controllers/recuperar.controller';

export async function POST(req: NextRequest) {
  return await controladorRecuperarContrasena(req);
}