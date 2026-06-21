import { NextRequest } from 'next/server';
import { controladorObtenerOpciones } from '@/gastos/controllers/gasto.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerOpciones(req);
}
