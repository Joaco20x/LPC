/**
 * @swagger
 * /api_dor/recuperar-contrasena:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un token de recuperación al correo del usuario.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosRecuperacion'
 *     responses:
 *       200:
 *         description: Token de recuperación generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       404:
 *         description: Correo no registrado
 */
import { NextRequest } from 'next/server';
import { controladorRecuperarContrasena } from '@/backend/controllers/recuperar.controller';

export async function POST(req: NextRequest) {
  return await controladorRecuperarContrasena(req);
}
