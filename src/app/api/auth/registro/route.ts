import { NextRequest } from "next/server";
import { controladorRegistro } from "@/auth/controllers/registro.controller";

export async function POST(req: NextRequest) {
  return await controladorRegistro(req);
}
