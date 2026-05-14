/**
 * @swagger
 * /api_dor/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario con correo y contraseña. Devuelve accessToken en el cuerpo y refreshToken en cookie httpOnly.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosInicioSesion'
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaAPI'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         usuario:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             nombre: { type: string }
 *                             correo: { type: string }
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas
 */
import { NextRequest } from 'next/server';
import { controladorLogin } from '@/backend/controllers/login.controller';

export async function POST(req: NextRequest) {
  return await controladorLogin(req);
}
