import { NextRequest } from "next/server";
import {
  controladorObtenerBalancesGrupo,
  controladorSaldarTransferencia,
} from "@/deudas/controllers/optimizacion.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return await controladorObtenerBalancesGrupo(req, resolvedParams.id);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return await controladorSaldarTransferencia(req, resolvedParams.id);
}
