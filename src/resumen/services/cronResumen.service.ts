import { Prisma } from "@prisma/client";
import { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import { IResumenRepository } from "../repositories/IResumenRepository";
import { INotificacionRepository, DatosCrearNotificacion } from "@/notificaciones/repositories/INotificacionRepository";
import { calcularEstadisticasRango } from "./estadisticas.service";

export async function generarResumenesMensuales(
  grupoRepo: IGrupoRepository,
  gastoRepo: IGastoRepository,
  resumenRepo: IResumenRepository,
  notificacionRepo: INotificacionRepository,
) {
  // 1. Determinar el mes anterior
  const ahora = new Date();
  const mesAnterior = ahora.getMonth() === 0 ? 12 : ahora.getMonth();
  const anioAnterior =
    ahora.getMonth() === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();

  // Rango de fechas del mes anterior
  // NOTA: Los meses en JS Date son 0-indexados. Así que (anioAnterior, mesAnterior - 1)
  const inicioMesAnterior = new Date(anioAnterior, mesAnterior - 1, 1);
  const finMesAnterior = new Date(
    anioAnterior,
    mesAnterior,
    0,
    23,
    59,
    59,
    999,
  );

  // 2. Obtener grupos activos
  const gruposActivos = await grupoRepo.obtenerTodosActivos();
  let generados = 0;

  for (const grupo of gruposActivos) {
    // 3. Chequear idempotencia: ¿Ya existe el resumen?
    const resumenExistente = await resumenRepo.obtenerPorGrupoYMes(
      grupo.id,
      mesAnterior,
      anioAnterior,
    );
    if (resumenExistente) {
      continue; // Ya se generó, lo saltamos
    }

    // 4. Calcular estadísticas para el mes anterior
    const stats = await calcularEstadisticasRango(
      grupo.id,
      inicioMesAnterior,
      finMesAnterior,
      gastoRepo,
    );

    // 5. Criterio: No generar si no hubo gastos
    if (stats.totalGastos <= 0) {
      continue;
    }

    // 6. Generar y guardar resumen
    const nuevoResumen = await resumenRepo.crear({
      idGrupo: grupo.id,
      mes: mesAnterior,
      anio: anioAnterior,
      totalGastos: stats.totalGastos,
      datosJson: stats as unknown as Prisma.InputJsonValue,
    });

    generados++;

    // 7. Distribuir notificaciones a los miembros actuales del grupo (activos)
    if (grupo.miembros.length > 0) {
      const notificaciones: DatosCrearNotificacion[] = grupo.miembros.map((m) => ({
        idUsuario: m.idUsuario,
        tipo: "NUEVO_RESUMEN_MENSUAL",
        metadata: {
          idGrupo: grupo.id,
          nombreGrupo: grupo.nombre,
          idResumen: nuevoResumen.id,
          mes: mesAnterior,
          anio: anioAnterior,
          total: stats.totalGastos,
        },
      }));

      await notificacionRepo.crearMuchas(notificaciones);
    }
  }

  return { generados, periodo: { mes: mesAnterior, anio: anioAnterior } };
}
