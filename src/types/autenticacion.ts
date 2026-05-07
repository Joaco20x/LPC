// Tipos para el módulo de autenticación (FR-01)

export interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}

export interface DatosRecuperacion {
  correo: string;
}

export interface RespuestaAutenticacion {
  exito: boolean;
  mensaje: string;
  token?: string;
}

export type ProveedorOAuth = 'google' | 'apple';

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}