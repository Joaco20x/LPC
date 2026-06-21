import { NextRequest } from 'next/server';
import { controladorCrearGasto, controladorObtenerGastos } from '../controllers/gasto.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerGastos(req);
}

export async function POST(req: NextRequest) {
  return await controladorCrearGasto(req);
}
