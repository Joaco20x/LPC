import { NextRequest } from "next/server";
import { controladorLogout } from "../../controllers/logout.controller";

export async function POST(req: NextRequest) {
  return await controladorLogout(req);
}
