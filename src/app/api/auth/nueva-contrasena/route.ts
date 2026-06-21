import { NextRequest } from "next/server";
import { controladorNuevaContrasena } from "@/auth/controllers/nueva-contrasena.controller";

export async function POST(req: NextRequest) {
  return await controladorNuevaContrasena(req);
}
