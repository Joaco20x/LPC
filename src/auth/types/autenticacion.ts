// Tipos para el módulo de autenticación (FR-01)
// OCP: se extiende RespuestaAutenticacion con campo datos sin romper lo existente

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

// Se agrega el campo datos para recibir accessToken y usuario desde la API
export interface RespuestaAutenticacion {
  exito: boolean;
  mensaje: string;
  token?: string;
  datos?: {
    accessToken: string;
    refreshToken?: string;
    usuario?: {
      id: string;
      nombre: string;
      correo: string;
      verificado: boolean;
    };
  };
}

export type ProveedorOAuth = 'google' | 'apple';

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}
