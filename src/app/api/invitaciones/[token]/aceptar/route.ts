import { NextRequest } from "next/server";
import { controladorAceptarInvitacion } from "@/invitaciones/controllers/invitacion.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return controladorAceptarInvitacion(req, { token });
}
