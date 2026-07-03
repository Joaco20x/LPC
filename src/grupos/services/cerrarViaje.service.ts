import { Prisma } from "@prisma/client";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import type { IResumenRepository } from "@/resumen/repositories/IResumenRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { INotificacionRepository } from "@/notificaciones/repositories/INotificacionRepository";
import { calcularEstadisticasRango } from "@/resumen/services/estadisticas.service";

export interface DeudaPendienteInfo {
  id: string;
  deudor: string;
  acreedor: string;
  monto: number;
  moneda: string;
}

interface CerrarViajeResultado {
  cerrado: boolean;
  mensaje: string;
  deudasPendientes?: DeudaPendienteInfo[];
  resumen?: { totalGastos: number; cantidadGastos: number };
}

interface CerrarViajeParams {
  idGrupo: string;
  idUsuario: string;
  forzar: boolean;
  grupoRepo: IGrupoRepository;
  deudaRepo: IDeudaRepository;
  gastoRepo: IGastoRepository;
  resumenRepo: IResumenRepository;
  miembroRepo: IMiembroGrupoRepository;
  notificacionRepo: INotificacionRepository;
}

export async function cerrarViaje(
  params: CerrarViajeParams,
): Promise<CerrarViajeResultado> {
  const { idGrupo, idUsuario, forzar, grupoRepo, deudaRepo, gastoRepo, resumenRepo, miembroRepo, notificacionRepo } = params;

  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const esAdmin = grupo.miembros.some(
    (m) => m.usuario.id === idUsuario && m.rol === "admin",
  );
  if (!esAdmin) throw new Error("Solo el administrador puede cerrar el viaje");

  if (grupo.estado === "cerrado") throw new Error("El viaje ya está cerrado");

  const deudas =
    await deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas(idGrupo);
  const deudasPendientes = deudas.filter((d) => !d.saldada);

  if (deudasPendientes.length > 0 && !forzar) {
    const plural = deudasPendientes.length === 1 ? "" : "s";
    return {
      cerrado: false,
      mensaje: `Hay ${deudasPendientes.length} deuda${plural} pendiente${plural}. Revisa el listado antes de continuar.`,
      deudasPendientes: deudasPendientes.map((d) => ({
        id: d.id,
        deudor: d.deudor.nombre,
        acreedor: d.acreedor.nombre,
        monto: Number(d.monto),
        moneda: d.moneda,
      })),
    };
  }

  const fechaInicio = new Date(grupo.fechaInicio);
  const fechaFin = new Date(grupo.fechaFin);

  const deudasSaldadas = deudas
    .filter((d) => d.saldada)
    .map((d) => ({
      idDeudor: d.idDeudor,
      idAcreedor: d.idAcreedor,
      monto: Number(d.monto),
      moneda: d.moneda,
    }));

  const stats = await calcularEstadisticasRango(
    idGrupo,
    fechaInicio,
    fechaFin,
    gastoRepo,
    grupo.monedaBase,
    deudasSaldadas,
  );

  const ahora = new Date();
  await resumenRepo.crear({
    idGrupo,
    mes: ahora.getMonth() + 1,
    anio: ahora.getFullYear(),
    totalGastos: stats.totalGastos,
    datosJson: stats as unknown as Prisma.InputJsonValue,
  });

  await grupoRepo.actualizarEstado(idGrupo, "cerrado");

  const miembros = await miembroRepo.buscarPorGrupo(idGrupo);
  if (miembros.length > 0) {
    await notificacionRepo.crearMuchas(
      miembros.map((m) => ({
        idUsuario: m.idUsuario,
        tipo: "cierre_viaje" as const,
        metadata: {
          idGrupo,
          nombreGrupo: grupo.nombre,
        },
      })),
    );
  }

  const cantidadGastos = grupo.gastos.length;

  return {
    cerrado: true,
    mensaje: "Viaje cerrado correctamente",
    resumen: {
      totalGastos: stats.totalGastos,
      cantidadGastos,
    },
  };
}
