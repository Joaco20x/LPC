/**
 * @swagger
 * /api_dor/gastos:
 *   get:
 *     summary: Obtener todos los gastos
 *     description: Retorna la lista completa de gastos registrados.
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de gastos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Registrar un nuevo gasto
 *     description: Crea un gasto con divisiones entre miembros de un grupo.
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosGasto'
 *     responses:
 *       201:
 *         description: Gasto registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
import { NextRequest } from 'next/server';
import { controladorCrearGasto, controladorObtenerGastos } from '@/backend/controllers/gasto.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerGastos(req);
}

export async function POST(req: NextRequest) {
  return await controladorCrearGasto(req);
}
