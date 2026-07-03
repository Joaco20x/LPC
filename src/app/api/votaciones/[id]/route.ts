import { NextRequest } from 'next/server';
import { controladorObtenerVotacion } from '@/votaciones/controllers/votacion.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controladorObtenerVotacion(req, { id });
}
