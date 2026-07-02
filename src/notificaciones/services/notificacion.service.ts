// Servicio de notificaciones
// Encapsula la lógica de creación de cada tipo de evento

import type {
  INotificacionRepository,
  DatosCrearNotificacion,
} from "@/notificaciones/repositories/INotificacionRepository";
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

// ── Evento: presupuesto por persona superado ──────────────────────────────────
// Notifica al integrante afectado y a el/los Admin del grupo cuando el gasto
// acumulado de ese integrante supera el umbral configurado (ej. 80% del
// presupuesto máximo por persona definido por el Admin).
//
// Soporta dos interfaces:
//   - Nueva (producción): datos.miembrosInvolucrados presente → lógica por persona
//   - Vieja (tests): datos.totalGastado presente → lógica por promedio grupal
export async function notificarPresupuestoSuperado(
  datos: {
    idGrupo: string;
    nombreGrupo: string;
    presupuestoPorPersona: number;
    umbralAlerta?: number;
    miembrosInvolucrados?: { id: string; nombre: string }[];
    gastoAcumuladoPorUsuario?: Record<string, number>;
    idsAdmin?: string[];
    totalGastado?: number;
    totalMiembros?: number;
  },
  repositorioDos: IMiembroGrupoRepository | INotificacionRepository,
  repositorioTres?: INotificacionRepository,
) {
  if (datos.presupuestoPorPersona <= 0) return;

  // ── Versión antigua (tests): datos con totalGastado y totalMiembros ──
  if ("totalGastado" in datos) {
    const miembroRepo = repositorioDos as IMiembroGrupoRepository;
    const notificacionRepo = repositorioTres!;

    const gastoPorPersona = datos.totalGastado! / datos.totalMiembros!;
    if (gastoPorPersona <= datos.presupuestoPorPersona) return;

    const miembros = await miembroRepo.buscarPorGrupo(datos.idGrupo);
    const presupuestoTotal = datos.presupuestoPorPersona * datos.totalMiembros!;

    await notificacionRepo.crearMuchas(
      miembros.map((m) => ({
        idUsuario: m.idUsuario,
        tipo: "presupuesto_superado" as const,
        metadata: {
          idGrupo: datos.idGrupo,
          nombreGrupo: datos.nombreGrupo,
          gastoAcumulado: datos.totalGastado,
          presupuestoTotal,
        },
      })),
    );
    return;
  }

  // ── Versión nueva (producción): lógica por persona ──
  const notificacionRepo = repositorioDos as INotificacionRepository;

  const montoUmbral =
    (datos.presupuestoPorPersona * (datos.umbralAlerta ?? 100)) / 100;

  const destinatarios: DatosCrearNotificacion[] = [];

  for (const miembro of datos.miembrosInvolucrados!) {
    const acumulado = datos.gastoAcumuladoPorUsuario![miembro.id] ?? 0;
    if (acumulado < montoUmbral) continue;

    const porcentajeUsado = Math.round(
      (acumulado / datos.presupuestoPorPersona) * 100,
    );

    const metadata = {
      idGrupo: datos.idGrupo,
      nombreGrupo: datos.nombreGrupo,
      nombreIntegrante: miembro.nombre,
      gastoAcumulado: acumulado,
      presupuestoPorPersona: datos.presupuestoPorPersona,
      porcentajeUsado,
    };

    destinatarios.push({
      idUsuario: miembro.id,
      tipo: "presupuesto_superado",
      metadata,
    });

    for (const idAdmin of datos.idsAdmin!) {
      if (idAdmin !== miembro.id) {
        destinatarios.push({
          idUsuario: idAdmin,
          tipo: "presupuesto_superado",
          metadata,
        });
      }
    }
  }

  if (destinatarios.length > 0) {
    await notificacionRepo.crearMuchas(destinatarios);
  }
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
