import { NextRequest } from "next/server";
import { controladorCronResumen } from "@/resumen/controllers/cron.controller";

export async function GET(req: NextRequest) {
  return controladorCronResumen(req);
}
