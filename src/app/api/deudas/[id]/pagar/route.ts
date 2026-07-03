import { NextRequest } from "next/server";
import { controladorPagarDeuda } from "@/deudas/controllers/deudas.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorPagarDeuda(req, { id });
}
