import { NextRequest } from "next/server";
import {
  controladorCrearInvitacion,
  controladorObtenerInvitaciones,
} from "@/invitaciones/controllers/invitacion.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorObtenerInvitaciones(req, { id });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorCrearInvitacion(req, { id });
}
