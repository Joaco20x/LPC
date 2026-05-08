// lib/api/respuestas.ts
// Helpers para construir respuestas HTTP consistentes en todas las API routes
// OCP: agregar nuevos códigos no rompe los existentes

import { NextResponse } from 'next/server';

export function respuestaExito<T>(datos: T, status = 200) {
  return NextResponse.json({ exito: true, datos }, { status });
}

export function respuestaError(mensaje: string, status = 400) {
  return NextResponse.json({ exito: false, mensaje }, { status });
}

export function respuestaNoAutorizado(mensaje = 'No autorizado') {
  return NextResponse.json({ exito: false, mensaje }, { status: 401 });
}

export function respuestaConflicto(mensaje: string) {
  return NextResponse.json({ exito: false, mensaje }, { status: 409 });
}

export function respuestaErrorServidor(mensaje = 'Error interno del servidor') {
  return NextResponse.json({ exito: false, mensaje }, { status: 500 });
}