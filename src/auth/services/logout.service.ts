import type { ISesionRepository } from '@/auth/repositories/ISesionRepository';

export async function terminarSesion(refreshToken: string, sesionRepo: ISesionRepository) {
  await sesionRepo.eliminarPorTokenHash(refreshToken);
}
