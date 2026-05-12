// Servicio de gastos - Principio de Responsabilidad Única (SRP)
// Responsabilidad: calcular divisiones y persistir en BD

import { prisma } from '@/backend/db/prisma';
import type { DatosRegistroGasto, DivisionIntegrante, TipoDivision } from '@/shared/types/gastos';

export function calcularDivisiones(
  monto: number,
  integrantes: string[],
  tipo: TipoDivision,
  porcentajes?: Record<string, number>,
  manuales?: Record<string, number>
): DivisionIntegrante[] {
  if (!integrantes.length) return [];

  switch (tipo) {
    case 'equitativa': {
      const base = Math.floor((monto / integrantes.length) * 100) / 100;
      const resto = Math.round((monto - base * integrantes.length) * 100) / 100;
      return integrantes.map((id, i) => ({
        idUsuario: id,
        montoAsignado: i === 0 ? base + resto : base,
      }));
    }
    case 'porcentual': {
      return integrantes.map((id) => ({
        idUsuario: id,
        montoAsignado: Math.round(((monto * (porcentajes?.[id] ?? 0)) / 100) * 100) / 100,
        porcentaje: porcentajes?.[id] ?? 0,
      }));
    }
    case 'manual': {
      return integrantes.map((id) => ({
        idUsuario: id,
        montoAsignado: manuales?.[id] ?? 0,
      }));
    }
  }
}

export async function procesarRegistroGasto(datos: DatosRegistroGasto): Promise<string> {
  const gasto = await prisma.gasto.create({
    data: {
      idGrupo:    datos.idGrupo,
      idPagador:  datos.idPagador,
      monto:      datos.monto,
      descripcion: datos.descripcion,
      categoria:  datos.categoria,
      urlBoleta:  datos.urlBoleta ?? null,
      divisionesGasto: {
        create: datos.divisiones.map((d) => ({
          idUsuario:     d.idUsuario,
          montoAsignado: d.montoAsignado,
          tipoDivision:  datos.tipoDivision,
        })),
      },
    },
  });

  return gasto.id;
}
