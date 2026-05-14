/**
 * @swagger
 * /api_dor/deudas:
 *   get:
 *     summary: Obtener deudas pendientes
 *     description: Retorna las deudas activas del usuario autenticado, separadas en "debo a" y "me deben".
 *     tags: [Deudas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de deudas pendientes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaAPI'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       $ref: '#/components/schemas/DeudasPendientes'
 *       401:
 *         description: No autorizado
 */
import { NextRequest } from 'next/server';
import { controladorDeudas } from '@/backend/controllers/deudas.controller';

export async function GET(req: NextRequest) {
    return controladorDeudas(req);
}
