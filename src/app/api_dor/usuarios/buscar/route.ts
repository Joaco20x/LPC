import { NextRequest } from 'next/server';
import { controladorBuscarUsuario } from '@/backend/controllers/usuarios.controller';

export async function GET(req: NextRequest) {
  return await controladorBuscarUsuario(req);
}