import { NextRequest } from "next/server";
import { controladorBuscarUsuario } from "../../../controllers/usuarios.controller";

export async function GET(req: NextRequest) {
  return await controladorBuscarUsuario(req);
}
