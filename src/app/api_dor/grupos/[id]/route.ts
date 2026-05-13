import { NextRequest } from 'next/server';
import { controladorObtenerDetalleGrupo } from '@/backend/controllers/grupos.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return await controladorObtenerDetalleGrupo(req, resolvedParams);
}
