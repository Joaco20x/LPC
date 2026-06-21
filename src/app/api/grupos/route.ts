import { NextRequest } from 'next/server';
import { controladorCrearGrupo, controladorObtenerGrupos } from '@/grupos/controllers/grupos.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerGrupos(req);
}

export async function POST(req: NextRequest) {
  return await controladorCrearGrupo(req);
}
