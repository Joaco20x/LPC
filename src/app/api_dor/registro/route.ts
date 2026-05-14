/**
 * @swagger
 * /api_dor/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: Crea una cuenta nueva con nombre, correo y contraseña.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosRegistro'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       400:
 *         description: Datos inválidos o correo ya registrado
 */
import { NextRequest } from 'next/server';
import { controladorRegistro } from '@/backend/controllers/registro.controller';

export async function POST(req: NextRequest) {
  return await controladorRegistro(req);
}
