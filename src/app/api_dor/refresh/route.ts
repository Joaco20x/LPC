/**
 * @swagger
 * /api_dor/refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     description: Genera un nuevo accessToken a partir de un refreshToken válido.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosRefreshToken'
 *     responses:
 *       200:
 *         description: Token renovado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       401:
 *         description: RefreshToken inválido o expirado
 */
import { NextRequest } from 'next/server';
import { controladorRefresh } from '@/backend/controllers/refresh.controller';

export async function POST(req: NextRequest) {
  return await controladorRefresh(req);
}
