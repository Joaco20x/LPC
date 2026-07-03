import { NextRequest } from "next/server";
import { controladorRechazarComprobante } from "@/deudas/controllers/comprobante.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ idComprobante: string }> },
) {
  const { idComprobante } = await params;
  return controladorRechazarComprobante(req, { idComprobante });
}
