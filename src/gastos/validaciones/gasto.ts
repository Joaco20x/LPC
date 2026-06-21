// Validaciones del módulo de gastos

import { DatosGasto, ErrorCampoGasto } from '@/gastos/types/gasto';

export function validarMonto(monto: number | null | undefined): string | null {
  if (monto === undefined || monto === null || monto === 0) return null; // opcional por ahora
  if (monto < 0) return 'El monto no puede ser negativo';
  return null;
}

export function validarDescripcion(descripcion: string | null | undefined): string | null {
  if (!descripcion) return null; // opcional por ahora
  if (descripcion.trim().length < 3) return 'La descripción debe tener al menos 3 caracteres';
  if (descripcion.trim().length > 255) return 'La descripción no puede superar los 255 caracteres';
  return null;
}

export function validarCategoria(categoria: string | null | undefined): string | null {
  const categoriasValidas = ['Comida', 'Transporte', 'Alojamiento', 'Entretenimiento', 'Otros'];
  if (!categoria) return null; // opcional por ahora
  if (!categoriasValidas.includes(categoria)) return 'Categoría no válida';
  return null;
}

export function validarGrupo(idGrupo: string | null | undefined): string | null {
  if (!idGrupo || idGrupo.trim() === '') return 'El gasto debe estar asociado a un grupo válido';
  return null;
}

export function validarGasto(datos: DatosGasto): ErrorCampoGasto[] {
  const errores: ErrorCampoGasto[] = [];

  const errorMonto = validarMonto(datos.monto);
  if (errorMonto) errores.push({ campo: 'monto', mensaje: errorMonto });

  const errorDescripcion = validarDescripcion(datos.descripcion);
  if (errorDescripcion) errores.push({ campo: 'descripcion', mensaje: errorDescripcion });

  const errorCategoria = validarCategoria(datos.categoria);
  if (errorCategoria) errores.push({ campo: 'categoria', mensaje: errorCategoria });

  const errorGrupo = validarGrupo(datos.idGrupo);
  if (errorGrupo) errores.push({ campo: 'idGrupo', mensaje: errorGrupo });

  // Validar divisiones si se proporcionan
  if (datos.divisiones && datos.divisiones.length > 0) {
    datos.divisiones.forEach((div, i) => {
      if (!div.idUsuario) {
        errores.push({ campo: `divisiones[${i}].idUsuario`, mensaje: 'El usuario de la división es requerido' });
      }
      if (div.montoAsignado < 0) {
        errores.push({ campo: `divisiones[${i}].montoAsignado`, mensaje: 'El monto asignado no puede ser negativo' });
      }
    });

    const montoTotal = datos.monto ?? 0;
    if (montoTotal > 0) {
      // Validar que divisiones de tipo "exacto" sumen exactamente el monto total
      const divisionesExactas = datos.divisiones.filter((d) => d.tipoDivision === 'exacto');
      if (divisionesExactas.length > 0) {
        const sumaExacta = divisionesExactas.reduce((acc, d) => acc + d.montoAsignado, 0);
        if (Math.abs(sumaExacta - montoTotal) > 0.01) {
          const fmtSuma  = sumaExacta.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
          const fmtTotal = montoTotal.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
          errores.push({
            campo: 'divisiones',
            mensaje:
              sumaExacta < montoTotal
                ? `Falta dinero por asignar: la suma de las divisiones es ${fmtSuma} pero el gasto total es ${fmtTotal}.`
                : `Exceso de dinero asignado: la suma de las divisiones es ${fmtSuma} pero el gasto total es ${fmtTotal}.`,
          });
        }
      }

      // Validar que divisiones por porcentaje sumen exactamente 100 %
      const divisionesPorcentaje = datos.divisiones.filter((d) => d.tipoDivision === 'porcentaje');
      if (divisionesPorcentaje.length > 0) {
        const sumaPct = divisionesPorcentaje.reduce((acc, d) => acc + d.montoAsignado, 0);
        if (Math.abs(sumaPct - 100) > 0.01) {
          errores.push({
            campo: 'divisiones',
            mensaje: `La suma de los porcentajes debe ser exactamente 100 % (actualmente es ${sumaPct} %).`,
          });
        }
      }
    }
  }

  return errores;
}
