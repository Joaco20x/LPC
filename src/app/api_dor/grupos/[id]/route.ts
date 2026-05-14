/**
 * @swagger
 * /api_dor/grupos/{id}:
 *   get:
 *     summary: Obtener detalle de un grupo
 *     description: Retorna la información completa de un grupo, incluyendo miembros y gastos.
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del grupo
 *     responses:
 *       200:
 *         description: Detalle del grupo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaAPI'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Grupo no encontrado
 */
import { NextRequest } from 'next/server';
import { controladorObtenerDetalleGrupo } from '@/backend/controllers/grupos.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return await controladorObtenerDetalleGrupo(req, resolvedParams);
}
