import { NextRequest } from "next/server";
import { controladorActualizarPresupuesto } from "@/grupos/controllers/grupos.controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return await controladorActualizarPresupuesto(req, resolvedParams);
}
