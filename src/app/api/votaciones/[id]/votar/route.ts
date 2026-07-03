import { NextRequest } from "next/server";
import { controladorEmitirVoto } from "@/votaciones/controllers/votacion.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return controladorEmitirVoto(req, { id });
}
