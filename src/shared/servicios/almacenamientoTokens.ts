// src/shared/servicios/almacenamientoToken.ts

/**
 * Servicio centralizado para gestionar tokens en localStorage
 * Principio SRP: única responsabilidad de gestionar el almacenamiento
 */

const CLAVE_ACCESS_TOKEN = 'lpc_access_token';
const CLAVE_DATOS_USUARIO = 'lpc_datos_usuario';

interface DatosUsuario {
  id: string;
  nombre: string;
  correo: string;
  verificado: boolean;
}

export function guardarAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLAVE_ACCESS_TOKEN, token);
  }
}

export function obtenerAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CLAVE_ACCESS_TOKEN);
  }
  return null;
}

export function eliminarAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLAVE_ACCESS_TOKEN);
  }
}

export function guardarDatosUsuario(datos: DatosUsuario): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLAVE_DATOS_USUARIO, JSON.stringify(datos));
  }
}

export function obtenerDatosUsuario(): DatosUsuario | null {
  if (typeof window !== 'undefined') {
    const datos = localStorage.getItem(CLAVE_DATOS_USUARIO);
    return datos ? JSON.parse(datos) : null;
  }
  return null;
}

export function eliminarDatosUsuario(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLAVE_DATOS_USUARIO);
  }
}

export function limpiarSesion(): void {
  eliminarAccessToken();
  eliminarDatosUsuario();
}