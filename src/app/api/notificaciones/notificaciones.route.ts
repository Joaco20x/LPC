import { NextRequest } from "next/server";
import {
  controladorObtenerNotificaciones,
  controladorMarcarTodasLeidas,
} from "@/notificaciones/controllers/notificacion.controller";

export async function GET(req: NextRequest) {
  return controladorObtenerNotificaciones(req);
}

export async function PATCH(req: NextRequest) {
  return controladorMarcarTodasLeidas(req);
}
