// Validaciones del módulo de gastos - Principio de Responsabilidad Única (SRP)
// Cada función valida un único campo o conjunto de datos

import type { DatosRegistroGasto, DivisionIntegrante, ErrorCampoGasto, TipoDivision } from '@/shared/types/gastos';

const DESCRIPCION_MIN = 3;
const DESCRIPCION_MAX = 255;

export function validarMonto(monto: number): string | null {
  if (!monto || isNaN(monto)) return 'El monto es obligatorio';
  if (monto <= 0) return 'El monto debe ser mayor a 0';
  return null;
}

export function validarDescripcion(descripcion: string): string | null {
  if (!descripcion.trim()) return 'La descripción es obligatoria';
  if (descripcion.trim().length < DESCRIPCION_MIN) return `Mínimo ${DESCRIPCION_MIN} caracteres`;
  if (descripcion.length > DESCRIPCION_MAX) return `Máximo ${DESCRIPCION_MAX} caracteres`;
  return null;
}

export function validarCategoria(categoria: string): string | null {
  const validas = ['alojamiento', 'transporte', 'comida', 'actividad', 'otro'];
  if (!categoria) return 'La categoría es obligatoria';
  if (!validas.includes(categoria)) return 'Categoría no válida';
  return null;
}

export function validarPagador(idPagador: string): string | null {
  if (!idPagador) return 'Debes seleccionar quién pagó';
  return null;
}

export function validarDivisiones(
  divisiones: DivisionIntegrante[],
  monto: number,
  tipo: TipoDivision
): string | null {
  if (!divisiones.length) return 'Debes incluir al menos un integrante';

  if (tipo === 'porcentual') {
    const sumaPct = divisiones.reduce((s, d) => s + (d.porcentaje ?? 0), 0);
    if (Math.round(sumaPct) !== 100)
      return `Los porcentajes suman ${sumaPct}%, deben sumar 100%`;
  }

  if (tipo === 'manual') {
    const sumaMontos = divisiones.reduce((s, d) => s + d.montoAsignado, 0);
    if (Math.round(sumaMontos) !== Math.round(monto))
      return `La suma manual (${sumaMontos}) no coincide con el total (${monto})`;
  }

  return null;
}

export function validarRegistroGasto(datos: DatosRegistroGasto): ErrorCampoGasto[] {
  const errores: ErrorCampoGasto[] = [];

  const errorMonto = validarMonto(datos.monto);
  if (errorMonto) errores.push({ campo: 'monto', mensaje: errorMonto });

  const errorDescripcion = validarDescripcion(datos.descripcion);
  if (errorDescripcion) errores.push({ campo: 'descripcion', mensaje: errorDescripcion });

  const errorCategoria = validarCategoria(datos.categoria);
  if (errorCategoria) errores.push({ campo: 'categoria', mensaje: errorCategoria });

  const errorPagador = validarPagador(datos.idPagador);
  if (errorPagador) errores.push({ campo: 'idPagador', mensaje: errorPagador });

  const errorDivisiones = validarDivisiones(datos.divisiones, datos.monto, datos.tipoDivision);
  if (errorDivisiones) errores.push({ campo: 'divisiones', mensaje: errorDivisiones });

  return errores;
}
