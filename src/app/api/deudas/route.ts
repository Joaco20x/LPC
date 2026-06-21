import { NextRequest } from "next/server";
import { controladorDeudas } from "@/deudas/controllers/deudas.controller";

export async function GET(req: NextRequest) {
  return controladorDeudas(req);
}
