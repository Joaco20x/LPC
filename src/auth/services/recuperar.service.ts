import crypto from "crypto";
import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { ITokenRecuperacionRepository } from "@/auth/repositories/ITokenRecuperacionRepository";

export async function iniciarRecuperacion(
  correo: string,
  usuarioRepo: IUsuarioRepository,
  tokenRepo: ITokenRecuperacionRepository,
) {
  const usuario = await usuarioRepo.buscarPorCorreo(correo);
  if (!usuario) return;

  await tokenRepo.invalidarPorIdUsuario(usuario.id);

  const token = crypto.randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + 30 * 60 * 1000);

  await tokenRepo.crear({ idUsuario: usuario.id, token, expiraEn });

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[DEV] Recuperación: ${process.env.NEXT_PUBLIC_URL}/nueva-contrasena?token=${token}`,
    );
  }
}
