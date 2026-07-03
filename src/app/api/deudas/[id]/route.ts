import { NextRequest } from "next/server";
import { controladorObtenerDeuda } from "@/deudas/controllers/deudas.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorObtenerDeuda(req, { id });
}
