// Servicio de gastos — SRP: lógica de negocio pura, sin HTTP
// Responsabilidad: calcular divisiones y persistir en BD

import type { DatosRegistroGasto, DivisionIntegrante, TipoDivision } from '@/types/gastos';

// ── Cálculo de divisiones ─────────────────────────────────

/**
 * Calcula el monto asignado a cada integrante según el tipo de división.
 * No accede a la BD — es lógica pura y testeable.
 */
export function calcularDivisiones(
  monto: number,
  integrantes: string[],     // lista de idUsuario incluidos
  tipo: TipoDivision,
  porcentajes?: Record<string, number>,  // solo en modo porcentual
  manuales?: Record<string, number>      // solo en modo manual
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
      return integrantes.map((id) => {
        const pct = porcentajes?.[id] ?? 0;
        return {
          idUsuario: id,
          montoAsignado: Math.round((monto * pct) / 100 * 100) / 100,
          porcentaje: pct,
        };
      });
    }

    case 'manual': {
      return integrantes.map((id) => ({
        idUsuario: id,
        montoAsignado: manuales?.[id] ?? 0,
      }));
    }
  }
}

// ── Persistencia ──────────────────────────────────────────

/**
 * Persiste el gasto y sus divisiones en la base de datos.
 * Retorna el UUID del gasto creado.
 *
 * TODO: reemplazar el mock por el cliente de BD real (ej: Prisma, pg, Drizzle).
 */
export async function registrarGasto(datos: DatosRegistroGasto): Promise<string> {
  // ── Mock de BD ────────────────────────────────────────────
  // En producción, este bloque ejecuta:
  //   1. INSERT INTO gastos (...) VALUES (...) RETURNING id
  //   2. INSERT INTO divisiones_gasto (...) VALUES (...)  [bulk]
  //   3. UPSERT INTO deudas (...)  — actualizar saldos por cada división
  // Todo dentro de una transacción.

  console.log('[GastoService] Registrando gasto:', {
    grupo: datos.idGrupo,
    pagador: datos.idPagador,
    monto: datos.monto,
    tipo: datos.tipoDivision,
    divisiones: datos.divisiones.length,
  });

  // Simula latencia de red
  await new Promise((res) => setTimeout(res, 600));

  // Retorna un UUID simulado — en producción viene de la BD
  return crypto.randomUUID();
}
