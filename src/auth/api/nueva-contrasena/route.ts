import { NextRequest } from 'next/server';
import { controladorNuevaContrasena } from '../../controllers/nueva-contrasena.controller';

export async function POST(req: NextRequest) {
  return await controladorNuevaContrasena(req);
}
