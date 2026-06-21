// Servicio de autenticación — cliente
// Patrón Facade: abstrae todas las llamadas a la API de auth
// OCP: para agregar nuevas operaciones solo se añaden funciones

import type {
  DatosInicioSesion,
  DatosRegistro,
  DatosRecuperacion,
  RespuestaAutenticacion,
} from '@/auth/types/autenticacion';

const BASE_URL = '/api/auth';

async function manejarRespuesta<T>(res: Response): Promise<T> {
  const datos = await res.json();
  if (!res.ok) {
    throw new Error(datos.mensaje ?? 'Error desconocido');
  }
  return datos;
}

export async function registrar(
  datos: DatosRegistro
): Promise<RespuestaAutenticacion> {
  const res = await fetch(`${BASE_URL}/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res);
}

export async function iniciarSesion(
  datos: DatosInicioSesion
): Promise<RespuestaAutenticacion> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // credentials: 'include' permite que el servidor setee la cookie httpOnly
    credentials: 'include',
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res);
}

// El refreshToken viaja en cookie httpOnly — no se pasa manualmente
export async function cerrarSesion(): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function recuperarContrasena(
  datos: DatosRecuperacion
): Promise<RespuestaAutenticacion> {
  const res = await fetch(`${BASE_URL}/recuperar-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res);
}

export async function cambiarContrasena(
  token: string,
  contrasena: string
): Promise<RespuestaAutenticacion> {
  const res = await fetch(`${BASE_URL}/nueva-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, contrasena }),
  });
  return manejarRespuesta(res);
}
