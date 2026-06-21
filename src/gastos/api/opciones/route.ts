import { NextRequest } from "next/server";
import { controladorObtenerOpciones } from "../../controllers/gasto.controller";

export async function GET(req: NextRequest) {
  return await controladorObtenerOpciones(req);
}
