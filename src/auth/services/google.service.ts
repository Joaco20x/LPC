import { generarTokens } from '@/auth/services/jwt';
import type { IUsuarioRepository } from '@/auth/repositories/IUsuarioRepository';
import type { ISesionRepository } from '@/auth/repositories/ISesionRepository';

const DIAS_REFRESH = 7;

export interface DatosUsuarioGoogle {
  id: string;
  email: string;
  name: string;
  verified_email: boolean;
}

export async function procesarLoginGoogle(
  datosGoogle: DatosUsuarioGoogle,
  usuarioRepo: IUsuarioRepository,
  sesionRepo: ISesionRepository,
) {
  let usuario = await usuarioRepo.buscarPorOauth('google', datosGoogle.id);

  if (!usuario) {
    usuario = await usuarioRepo.buscarPorCorreo(datosGoogle.email);
  }

  if (!usuario) {
    usuario = await usuarioRepo.crear({
      nombre: datosGoogle.name,
      correo: datosGoogle.email,
      contrasenaHash: null,
      proveedorOauth: 'google',
      idProveedorOauth: datosGoogle.id,
      verificado: datosGoogle.verified_email,
    });
  }

  const tokens = generarTokens({ idUsuario: usuario.id, correo: usuario.correo });

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
