import { verificarContrasena } from "@/auth/services/contraseña";
import { generarTokens } from "@/auth/services/jwt";
import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { ISesionRepository } from "@/auth/repositories/ISesionRepository";

const DIAS_REFRESH = 7;

export async function procesarLogin(
  correo: string,
  contrasena: string,
  usuarioRepo: IUsuarioRepository,
  sesionRepo: ISesionRepository,
) {
  const usuario = await usuarioRepo.buscarPorCorreo(correo);

  if (!usuario || !usuario.contrasenaHash) {
    throw new Error("Credenciales incorrectas");
  }

  const contrasenaValida = await verificarContrasena(
    contrasena,
    usuario.contrasenaHash,
  );
  if (!contrasenaValida) {
    throw new Error("Credenciales incorrectas");
  }

  const tokens = generarTokens({
    idUsuario: usuario.id,
    correo: usuario.correo,
  });

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

  await sesionRepo.crear({
    idUsuario: usuario.id,
    tokenHash: tokens.refreshToken,
    expiraEn,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      verificado: usuario.verificado,
    },
  };
}
