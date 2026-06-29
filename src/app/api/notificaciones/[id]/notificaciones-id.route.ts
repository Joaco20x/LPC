import { NextRequest } from "next/server";
import { controladorMarcarUnaLeida } from "@/notificaciones/controllers/notificacion.controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorMarcarUnaLeida(req, id);
}
