import { NextRequest } from "next/server";
import {
  controladorSubirComprobante,
  controladorObtenerComprobantes,
} from "@/deudas/controllers/comprobante.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorObtenerComprobantes(req, { id });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorSubirComprobante(req, { id });
}
