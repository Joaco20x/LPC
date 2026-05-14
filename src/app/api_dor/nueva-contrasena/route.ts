/**
 * @swagger
 * /api_dor/nueva-contrasena:
 *   post:
 *     summary: Restablecer contraseña
 *     description: Cambia la contraseña usando un token de recuperación válido.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosNuevaContrasena'
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       400:
 *         description: Token inválido o expirado
 */
import { NextRequest } from 'next/server';
import { controladorNuevaContrasena } from '@/backend/controllers/nueva-contrasena.controller';

export async function POST(req: NextRequest) {
  return await controladorNuevaContrasena(req);
}
