import { NextRequest } from 'next/server';
import { controladorCrearVotacion, controladorObtenerVotaciones } from '@/votaciones/controllers/votacion.controller';

export async function GET(req: NextRequest) {
  return controladorObtenerVotaciones(req);
}

export async function POST(req: NextRequest) {
  return controladorCrearVotacion(req);
}
