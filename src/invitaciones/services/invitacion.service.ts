// src/invitaciones/services/invitacion.service.ts

import crypto from "node:crypto";
import type { IInvitacionRepository } from "@/invitaciones/repositories/IInvitacionRepository";
import type {
  DatosCrearInvitacion,
  InvitacionConEstado,
} from "@/invitaciones/types/invitacion";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";

// ── Crear invitación ──────────────────────────────────────────────────────────
export async function crearInvitacion(
  datos: DatosCrearInvitacion,
  invitacionRepo: IInvitacionRepository,
  grupoRepo: IGrupoRepository,
): Promise<{ token: string; enlace: string }> {
  // Verificar que el grupo existe y que el invitador es admin
  const grupo = await grupoRepo.obtenerDetalle(datos.idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const esAdmin = grupo.miembros.some(
    (m) => m.idUsuario === datos.idInvitador && m.rol === "admin",
  );
  if (!esAdmin)
    throw new Error("Solo los administradores pueden crear invitaciones");

  // Validación por tipo
  if (datos.tipo === "correo") {
    if (!datos.correoInvitado)
      throw new Error("Se requiere correo para este tipo de invitación");
    // Invalidar invitaciones previas al mismo correo en este grupo
    await invitacionRepo.invalidarPorGrupoYCorreo(
      datos.idGrupo,
      datos.correoInvitado,
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + datos.expiraHoras * 60 * 60 * 1000);

  await invitacionRepo.crear({
    idGrupo: datos.idGrupo,
    idInvitador: datos.idInvitador,
    correoInvitado: datos.correoInvitado,
    token,
    tipo: datos.tipo,
    expiraEn,
  });

  const urlBase = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const enlace = `${urlBase}/invitar/${token}`;

  // Simular envío de correo en desarrollo
  if (datos.tipo === "correo" && datos.correoInvitado) {
    console.log(`[INVITACION] Correo a ${datos.correoInvitado} → ${enlace}`);
  }

  return { token, enlace };
}

// ── Aceptar invitación ───────────────────────────────────────────────────────
export async function aceptarInvitacion(
  token: string,
  idUsuario: string,
  invitacionRepo: IInvitacionRepository,
  miembroRepo: IMiembroGrupoRepository,
): Promise<{ idGrupo: string }> {
  const inv = await invitacionRepo.buscarPorToken(token);
  if (!inv) throw new Error("Invitación no encontrada");
  if (inv.estado === "expirada") throw new Error("La invitación ha expirado");
  if (inv.estado === "aceptada")
    throw new Error("Esta invitación ya fue utilizada");

  // Verificar si ya es miembro
  const miembros = await miembroRepo.buscarPorGrupo(inv.idGrupo);
  const yaEsMiembro = miembros.some((m) => m.idUsuario === idUsuario);
  if (yaEsMiembro) throw new Error("Ya eres miembro de este grupo");

  // Agregar como miembro y marcar invitación como usada
  await miembroRepo.crearMuchas([
    { idGrupo: inv.idGrupo, idUsuario, rol: "miembro" },
  ]);
  await invitacionRepo.marcarComoUsada(token);

  return { idGrupo: inv.idGrupo };
}

// ── Obtener invitaciones de un grupo ─────────────────────────────────────────
export async function obtenerInvitacionesGrupo(
  idGrupo: string,
  idUsuario: string,
  invitacionRepo: IInvitacionRepository,
  grupoRepo: IGrupoRepository,
): Promise<InvitacionConEstado[]> {
  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const esAdmin = grupo.miembros.some(
    (m) => m.idUsuario === idUsuario && m.rol === "admin",
  );
  if (!esAdmin)
    throw new Error("Solo los administradores pueden ver las invitaciones");

  return invitacionRepo.buscarPorGrupo(idGrupo);
}

// ── Verificar token público (sin autenticación) ───────────────────────────────
export async function verificarTokenInvitacion(
  token: string,
  invitacionRepo: IInvitacionRepository,
  grupoRepo: IGrupoRepository,
): Promise<{
  invitacion: InvitacionConEstado;
  nombreGrupo: string;
  destino: string;
}> {
  const inv = await invitacionRepo.buscarPorToken(token);
  if (!inv) throw new Error("Invitación no encontrada");

  const grupo = await grupoRepo.obtenerDetalle(inv.idGrupo);
  if (!grupo) throw new Error("El grupo asociado ya no existe");

  return {
    invitacion: inv,
    nombreGrupo: grupo.nombre,
    destino: grupo.destino,
  };
}
