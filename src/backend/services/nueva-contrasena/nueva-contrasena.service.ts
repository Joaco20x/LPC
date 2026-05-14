import { hashearContrasena } from '@/backend/auth/contraseña';
import type { IUsuarioRepository } from '@/shared/repositories/IUsuarioRepository';
import type { ITokenRecuperacionRepository } from '@/shared/repositories/ITokenRecuperacionRepository';
import type { ISesionRepository } from '@/shared/repositories/ISesionRepository';

export async function cambiarContrasenaConToken(
  token: string,
  contrasena: string,
  tokenRepo: ITokenRecuperacionRepository,
  usuarioRepo: IUsuarioRepository,
  sesionRepo: ISesionRepository,
) {
  const tokenValido = await tokenRepo.buscarTokenValido(token);
  if (!tokenValido) throw new Error('Token inválido o expirado');

  const hash = await hashearContrasena(contrasena);

  await usuarioRepo.actualizarContrasena(tokenValido.idUsuario, hash);
  await tokenRepo.marcarComoUsado(tokenValido.id);
  await sesionRepo.eliminarPorIdUsuario(tokenValido.idUsuario);
}
