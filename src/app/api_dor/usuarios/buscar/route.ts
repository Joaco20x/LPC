/**
 * @swagger
 * /api_dor/usuarios/buscar:
 *   get:
 *     summary: Buscar usuarios
 *     description: Busca usuarios por correo electrónico.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo electrónico a buscar
 *     responses:
 *       200:
 *         description: Resultado de la búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       401:
 *         description: No autorizado
 */
import { NextRequest } from 'next/server';
import { controladorBuscarUsuario } from '@/backend/controllers/usuarios.controller';

export async function GET(req: NextRequest) {
  return await controladorBuscarUsuario(req);
}
