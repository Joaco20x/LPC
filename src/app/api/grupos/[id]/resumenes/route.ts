import { NextRequest } from "next/server";
import { controladorObtenerResumenesPorGrupo } from "@/resumen/controllers/resumen.controller";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  // Await the params before passing to the controller to comply with Next.js 15+ constraints
  const params = await context.params;
  return controladorObtenerResumenesPorGrupo(req, { params });
}
