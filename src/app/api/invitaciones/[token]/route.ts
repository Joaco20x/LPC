import { NextRequest } from 'next/server';
import { controladorVerificarToken } from '@/invitaciones/controllers/invitacion.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return controladorVerificarToken(req, { token });
}
