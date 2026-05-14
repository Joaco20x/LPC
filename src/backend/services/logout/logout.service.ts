import type { ISesionRepository } from '@/shared/repositories/ISesionRepository';

export async function terminarSesion(refreshToken: string, sesionRepo: ISesionRepository) {
  await sesionRepo.eliminarPorTokenHash(refreshToken);
}
