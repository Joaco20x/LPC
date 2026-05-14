/**
 * @swagger
 * /api_dor/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida el refreshToken de la sesión activa.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 */
import { NextRequest } from 'next/server';
import { controladorLogout } from '@/backend/controllers/logout.controller';

export async function POST(req: NextRequest) {
  return await controladorLogout(req);
}
