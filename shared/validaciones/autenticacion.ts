// Validaciones de autenticación - Principio de Responsabilidad Única (SRP)
// Cada función valida un único campo o conjunto de datos

import type { DatosInicioSesion, DatosRegistro, DatosRecuperacion, ErrorCampo } from '@/shared/types/autenticacion';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUD_MINIMA_CONTRASENA = 8;

export function validarCorreo(correo: string): string | null {
  if (!correo.trim()) return 'El correo es obligatorio';
  if (!REGEX_CORREO.test(correo)) return 'Ingresa un correo válido';
  return null;
}

export function validarContrasena(contrasena: string): string | null {
  if (!contrasena) return 'La contraseña es obligatoria';
  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    return `Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres`;
  }
  return null;
}

export function validarNombre(nombre: string): string | null {
  if (!nombre.trim()) return 'El nombre es obligatorio';
  if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
  return null;
}

export function validarInicioSesion(datos: DatosInicioSesion): ErrorCampo[] {
  const errores: ErrorCampo[] = [];

  const errorCorreo = validarCorreo(datos.correo);
  if (errorCorreo) errores.push({ campo: 'correo', mensaje: errorCorreo });

  const errorContrasena = validarContrasena(datos.contrasena);
  if (errorContrasena) errores.push({ campo: 'contrasena', mensaje: errorContrasena });

  return errores;
}

export function validarRegistro(datos: DatosRegistro): ErrorCampo[] {
  const errores: ErrorCampo[] = [];

  const errorNombre = validarNombre(datos.nombre);
  if (errorNombre) errores.push({ campo: 'nombre', mensaje: errorNombre });

  const errorCorreo = validarCorreo(datos.correo);
  if (errorCorreo) errores.push({ campo: 'correo', mensaje: errorCorreo });

  const errorContrasena = validarContrasena(datos.contrasena);
  if (errorContrasena) errores.push({ campo: 'contrasena', mensaje: errorContrasena });

  if (datos.contrasena !== datos.confirmarContrasena) {
    errores.push({ campo: 'confirmarContrasena', mensaje: 'Las contraseñas no coinciden' });
  }

  return errores;
}

export function validarRecuperacion(datos: DatosRecuperacion): ErrorCampo[] {
  const errores: ErrorCampo[] = [];

  const errorCorreo = validarCorreo(datos.correo);
  if (errorCorreo) errores.push({ campo: 'correo', mensaje: errorCorreo });

  return errores;
}