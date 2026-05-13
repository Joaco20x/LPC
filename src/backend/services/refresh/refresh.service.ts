// src/backend/services/refresh/refresh.service.ts

import { prisma } from '@/backend/db/prisma';
import { verificarRefreshToken, generarTokens } from '@/backend/auth/jwt';

export async function refrescarToken(refreshToken: string) {
  // Verificar que el token sea válido
  const payload = verificarRefreshToken(refreshToken);

  // Verificar que la sesión exista en BD
  const sesion = await prisma.sesion.findFirst({
    where: {
      tokenHash: refreshToken,
      expiraEn: { gt: new Date() },
    },
  });

  if (!sesion) {
    throw new Error('Sesión inválida o expirada');
  }

  // Generar nuevos tokens
  const tokens = generarTokens({
    idUsuario: payload.idUsuario,
    correo: payload.correo,
  });

  // Actualizar sesión en BD
  await prisma.sesion.update({
    where: { id: sesion.id },
    data: { tokenHash: tokens.refreshToken },
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}