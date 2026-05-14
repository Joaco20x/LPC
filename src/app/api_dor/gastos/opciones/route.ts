/**
 * @swagger
 * /api_dor/gastos/opciones:
 *   get:
 *     summary: Obtener opciones del formulario de gasto
 *     description: Retorna los grupos y miembros disponibles para crear un gasto.
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Opciones para el formulario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaAPI'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       $ref: '#/components/schemas/OpcionesFormulario'
 *       401:
 *         description: No autorizado
 */
import { NextRequest } from 'next/server';
import { controladorObtenerOpciones } from '@/backend/controllers/gasto.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerOpciones(req);
}
