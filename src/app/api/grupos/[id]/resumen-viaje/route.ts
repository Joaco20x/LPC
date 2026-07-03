import { NextRequest } from "next/server";
import { controladorObtenerResumenViaje } from "@/resumen/controllers/resumenViaje.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return controladorObtenerResumenViaje(req, params);
}
