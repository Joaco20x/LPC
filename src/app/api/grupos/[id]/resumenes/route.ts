import { NextRequest } from "next/server";
import { controladorObtenerResumenesPorGrupo } from "@/resumen/controllers/resumen.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return controladorObtenerResumenesPorGrupo(req, params);
}
