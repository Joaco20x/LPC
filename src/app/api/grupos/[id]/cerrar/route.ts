import { NextRequest } from "next/server";
import { controladorCerrarViaje } from "@/grupos/controllers/grupos.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  return await controladorCerrarViaje(req, resolvedParams);
}
