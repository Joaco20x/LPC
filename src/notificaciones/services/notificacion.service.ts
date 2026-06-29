// Servicio de notificaciones
// Encapsula la lógica de creación de cada tipo de evento

import type { INotificacionRepository } from "@/notificaciones/repositories/INotificacionRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";

// ── Obtener notificaciones del usuario ────────────────────────────────────────
export async function obtenerNotificaciones(
  idUsuario: string,
  notificacionRepo: INotificacionRepository,
) {
  return notificacionRepo.obtenerPorUsuario(idUsuario);
}

export async function contarNoLeidas(
  idUsuario: string,
  notificacionRepo: INotificacionRepository,
) {
  return notificacionRepo.contarNoLeidas(idUsuario);
}

// ── Marcar como leída ─────────────────────────────────────────────────────────
export async function marcarLeida(
  id: string,
  idUsuario: string,
  notificacionRepo: INotificacionRepository,
) {
  await notificacionRepo.marcarLeida(id, idUsuario);
}

export async function marcarTodasLeidas(
  idUsuario: string,
  notificacionRepo: INotificacionRepository,
) {
  await notificacionRepo.marcarTodasLeidas(idUsuario);
}

// ── Evento: nuevo gasto ───────────────────────────────────────────────────────
// Notifica a todos los miembros del grupo excepto al pagador
export async function notificarNuevoGasto(
  datos: {
    idGrupo: string;
    nombreGrupo: string;
    idPagador: string;
    nombrePagador: string;
    descripcion: string;
    monto: number;
  },
  miembroRepo: IMiembroGrupoRepository,
  notificacionRepo: INotificacionRepository,
) {
  const miembros = await miembroRepo.buscarPorGrupo(datos.idGrupo);
  const destinatarios = miembros
    .map((m) => m.idUsuario)
    .filter((id) => id !== datos.idPagador);

  if (destinatarios.length === 0) return;

  await notificacionRepo.crearMuchas(
    destinatarios.map((idUsuario) => ({
      idUsuario,
      tipo: "nuevo_gasto" as const,
      metadata: {
        idGrupo: datos.idGrupo,
        nombreGrupo: datos.nombreGrupo,
        descripcion: datos.descripcion,
        monto: datos.monto,
        pagador: datos.nombrePagador,
      },
    })),
  );
}

// ── Evento: presupuesto superado ──────────────────────────────────────────────
// Notifica a todos los miembros cuando el total supera el presupuesto
export async function notificarPresupuestoSuperado(
  datos: {
    idGrupo: string;
    nombreGrupo: string;
    totalGastado: number;
    presupuestoPorPersona: number;
    totalMiembros: number;
  },
  miembroRepo: IMiembroGrupoRepository,
  notificacionRepo: INotificacionRepository,
) {
  const miembros = await miembroRepo.buscarPorGrupo(datos.idGrupo);
  const presupuestoTotal = datos.presupuestoPorPersona * datos.totalMiembros;

  if (datos.totalGastado <= presupuestoTotal) return;

  await notificacionRepo.crearMuchas(
    miembros.map((m) => ({
      idUsuario: m.idUsuario,
      tipo: "presupuesto_superado" as const,
      metadata: {
        idGrupo: datos.idGrupo,
        nombreGrupo: datos.nombreGrupo,
        totalGastado: datos.totalGastado,
        presupuestoTotal,
      },
    })),
  );
}

// ── Evento: integrante añadido ────────────────────────────────────────────────
export async function notificarIntegranteAnadido(
  datos: {
    idGrupo: string;
    nombreGrupo: string;
    nombreNuevoIntegrante: string;
    idNuevoIntegrante: string;
  },
  miembroRepo: IMiembroGrupoRepository,
  notificacionRepo: INotificacionRepository,
) {
  const miembros = await miembroRepo.buscarPorGrupo(datos.idGrupo);
  const destinatarios = miembros
    .map((m) => m.idUsuario)
    .filter((id) => id !== datos.idNuevoIntegrante);

  if (destinatarios.length === 0) return;

  await notificacionRepo.crearMuchas(
    destinatarios.map((idUsuario) => ({
      idUsuario,
      tipo: "integrante_anadido" as const,
      metadata: {
        idGrupo: datos.idGrupo,
        nombreGrupo: datos.nombreGrupo,
        nuevoIntegrante: datos.nombreNuevoIntegrante,
      },
    })),
  );
}

// ── Evento: pago de deuda ─────────────────────────────────────────────────────
export async function notificarPagoDeuda(
  datos: {
    idAcreedor: string;
    nombreDeudor: string;
    nombreGrupo: string;
    monto: number;
  },
  notificacionRepo: INotificacionRepository,
) {
  await notificacionRepo.crear({
    idUsuario: datos.idAcreedor,
    tipo: "pago_deuda",
    metadata: {
      nombreDeudor: datos.nombreDeudor,
      nombreGrupo: datos.nombreGrupo,
      monto: datos.monto,
    },
  });
}
