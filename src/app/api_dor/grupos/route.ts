/**
 * @swagger
 * /api_dor/grupos:
 *   get:
 *     summary: Obtener grupos del usuario
 *     description: Retorna todos los grupos a los que pertenece el usuario autenticado.
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Crear un nuevo grupo
 *     description: Crea un grupo de viaje con sus integrantes.
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DatosCreacionGrupo'
 *     responses:
 *       201:
 *         description: Grupo creado
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
import { controladorCrearGrupo, controladorObtenerGrupos } from '@/backend/controllers/grupos.controller';

export async function GET(req: NextRequest) {
  return await controladorObtenerGrupos(req);
}

export async function POST(req: NextRequest) {
  return await controladorCrearGrupo(req);
}
