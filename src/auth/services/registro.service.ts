import { hashearContrasena } from "@/auth/services/contraseña";
import { generarTokens } from "@/auth/services/jwt";
import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { ISesionRepository } from "@/auth/repositories/ISesionRepository";

const DIAS_REFRESH = 7;

export async function crearNuevoUsuario(
  datos: { nombre: string; correo: string; contrasena: string },
  usuarioRepo: IUsuarioRepository,
  sesionRepo: ISesionRepository,
) {
  const usuarioExistente = await usuarioRepo.buscarPorCorreo(datos.correo);
  if (usuarioExistente) throw new Error("Este correo ya está registrado");

  const contrasenaHash = await hashearContrasena(datos.contrasena);

  const nuevoUsuario = await usuarioRepo.crear({
    nombre: datos.nombre,
    correo: datos.correo,
    contrasenaHash,
    verificado: false,
  });

  const tokens = generarTokens({
    idUsuario: nuevoUsuario.id,
    correo: nuevoUsuario.correo,
  });

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_REFRESH);

  await sesionRepo.crear({
    idUsuario: nuevoUsuario.id,
    tokenHash: tokens.refreshToken,
    expiraEn,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      correo: nuevoUsuario.correo,
      verificado: nuevoUsuario.verificado,
      creadoEn: nuevoUsuario.creadoEn,
    },
  };
}
