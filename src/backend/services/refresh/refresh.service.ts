import { verificarRefreshToken, generarTokens } from '@/backend/auth/jwt';
import type { ISesionRepository } from '@/shared/repositories/ISesionRepository';

export async function refrescarToken(refreshToken: string, sesionRepo: ISesionRepository) {
  const payload = verificarRefreshToken(refreshToken);

  const sesion = await sesionRepo.buscarPorTokenHash(refreshToken);
  if (!sesion) throw new Error('Sesión inválida o expirada');

  const tokens = generarTokens({ idUsuario: payload.idUsuario, correo: payload.correo });
  await sesionRepo.actualizarTokenHash(sesion.id, tokens.refreshToken);

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}
