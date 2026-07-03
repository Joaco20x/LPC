import type { IVotacionRepository } from '@/votaciones/repositories/IVotacionRepository';
import type { IMiembroGrupoRepository } from '@/grupos/repositories/IMiembroGrupoRepository';
import type { IDeudaRepository } from '@/deudas/repositories/IDeudaRepository';
import type { VotacionConDetalle, TipoVotacion, DecisionVoto } from '@/votaciones/types/votacion';

// ── Crear votación ────────────────────────────────────────
export async function crearVotacion(
  idGrupo: string,
  idDeuda: string,
  idCreador: string,
  tipo: TipoVotacion,
  votacionRepo: IVotacionRepository,
  miembroRepo: IMiembroGrupoRepository,
): Promise<{ id: string }> {
  // Verificar que el creador es miembro del grupo
  const miembros = await miembroRepo.buscarPorGrupo(idGrupo);
  const esMiembro = miembros.some((m) => m.idUsuario === idCreador);
  if (!esMiembro) throw new Error('No eres miembro de este grupo');

  // Verificar que no hay votación activa para esta deuda
  const existente = await votacionRepo.buscarPorDeuda(idDeuda);
  if (existente) throw new Error('Ya existe una votación activa para esta deuda');

  return votacionRepo.crear({ idGrupo, idDeuda, idCreador, tipo });
}

// ── Emitir voto ───────────────────────────────────────────
export async function emitirVoto(
  idVotacion: string,
  idUsuario: string,
  decision: DecisionVoto,
  votacionRepo: IVotacionRepository,
  miembroRepo: IMiembroGrupoRepository,
): Promise<VotacionConDetalle> {
  const votacion = await votacionRepo.buscarPorId(idVotacion);
  if (!votacion) throw new Error('Votación no encontrada');
  if (votacion.estado === 'resuelta') throw new Error('Esta votación ya fue resuelta');

  // Verificar que es miembro
  const miembros = await miembroRepo.buscarPorGrupo(votacion.idGrupo);
  const esMiembro = miembros.some((m) => m.idUsuario === idUsuario);
  if (!esMiembro) throw new Error('No eres miembro de este grupo');

  // Verificar que no ha votado antes
  const yaVoto = votacion.votos.some((v) => v.idUsuario === idUsuario);
  if (yaVoto) throw new Error('Ya emitiste tu voto en esta votación');

  await votacionRepo.registrarVoto(idVotacion, idUsuario, decision);

  // Recargar votación actualizada
  const actualizada = (await votacionRepo.buscarPorId(idVotacion))!;

  // Calcular si se alcanzó la mayoría
  const mayoria = Math.floor(actualizada.totalMiembros / 2) + 1;

  if (actualizada.aprobaciones >= mayoria) {
    await votacionRepo.resolver(idVotacion, 'aprobada');
    return (await votacionRepo.buscarPorId(idVotacion))!;
  }

  if (actualizada.rechazos >= mayoria) {
    await votacionRepo.resolver(idVotacion, 'rechazada');
    return (await votacionRepo.buscarPorId(idVotacion))!;
  }

  return actualizada;
}

// ── Obtener votaciones de un grupo ────────────────────────
export async function obtenerVotacionesGrupo(
  idGrupo: string,
  idUsuario: string,
  votacionRepo: IVotacionRepository,
  miembroRepo: IMiembroGrupoRepository,
): Promise<VotacionConDetalle[]> {
  const miembros = await miembroRepo.buscarPorGrupo(idGrupo);
  const esMiembro = miembros.some((m) => m.idUsuario === idUsuario);
  if (!esMiembro) throw new Error('No eres miembro de este grupo');
  return votacionRepo.buscarPorGrupo(idGrupo);
}

// ── Obtener votación por ID ───────────────────────────────
export async function obtenerVotacion(
  idVotacion: string,
  idUsuario: string,
  votacionRepo: IVotacionRepository,
  miembroRepo: IMiembroGrupoRepository,
): Promise<VotacionConDetalle> {
  const votacion = await votacionRepo.buscarPorId(idVotacion);
  if (!votacion) throw new Error('Votación no encontrada');

  const miembros = await miembroRepo.buscarPorGrupo(votacion.idGrupo);
  const esMiembro = miembros.some((m) => m.idUsuario === idUsuario);
  if (!esMiembro) throw new Error('No eres miembro de este grupo');

  return votacion;
}
