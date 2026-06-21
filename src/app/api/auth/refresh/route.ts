import { NextRequest } from "next/server";
import { controladorRefresh } from "@/auth/controllers/refresh.controller";

export async function POST(req: NextRequest) {
  return await controladorRefresh(req);
}
