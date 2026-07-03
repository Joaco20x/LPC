import { NextRequest, NextResponse } from 'next/server';
import { verificarAccessToken } from '@/auth/services/jwt';
import { crearDependencias } from '@/shared/di/crearDependencias';
import {
  crearVotacion,
  emitirVoto,
  obtenerVotacionesGrupo,
  obtenerVotacion,
} from '@/votaciones/services/votacion.service';

function extraerPayload(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ exito: false, mensaje: 'No autorizado' }, { status: 401 }) };
  }
  try {
    return { payload: verificarAccessToken(auth.split(' ')[1]) };
  } catch {
    return { error: NextResponse.json({ exito: false, mensaje: 'Token inválido' }, { status: 401 }) };
  }
}

// ── POST /api/votaciones ──────────────────────────────────
export async function controladorCrearVotacion(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { idGrupo, idDeuda, tipo } = await req.json();
    if (!idGrupo || !idDeuda || !tipo) {
      return NextResponse.json({ exito: false, mensaje: 'Faltan campos requeridos: idGrupo, idDeuda, tipo' }, { status: 400 });
    }
    if (!['abstencion', 'denuncia'].includes(tipo)) {
      return NextResponse.json({ exito: false, mensaje: 'tipo debe ser: abstencion o denuncia' }, { status: 400 });
    }

    const deps = crearDependencias();
    const resultado = await crearVotacion(
      idGrupo, idDeuda, payload!.idUsuario, tipo,
      deps.votacionRepo, deps.miembroGrupoRepo,
    );

    return NextResponse.json({ exito: true, mensaje: 'Votación iniciada', datos: resultado }, { status: 201 });
  } catch (err: any) {
    const estado = err.message === 'No eres miembro de este grupo' ? 403
      : err.message.includes('activa') ? 409 : 500;
    return NextResponse.json({ exito: false, mensaje: err.message }, { status: estado });
  }
}

// ── GET /api/votaciones?idGrupo=... ──────────────────────
export async function controladorObtenerVotaciones(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const idGrupo = req.nextUrl.searchParams.get('idGrupo');
    if (!idGrupo) {
      return NextResponse.json({ exito: false, mensaje: 'Se requiere idGrupo' }, { status: 400 });
    }

    const deps = crearDependencias();
    const votaciones = await obtenerVotacionesGrupo(
      idGrupo, payload!.idUsuario, deps.votacionRepo, deps.miembroGrupoRepo,
    );

    return NextResponse.json({ exito: true, datos: { votaciones } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ exito: false, mensaje: err.message }, { status: 403 });
  }
}

// ── GET /api/votaciones/[id] ─────────────────────────────
export async function controladorObtenerVotacion(req: NextRequest, params: { id: string }) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const deps = crearDependencias();
    const votacion = await obtenerVotacion(
      params.id, payload!.idUsuario, deps.votacionRepo, deps.miembroGrupoRepo,
    );

    return NextResponse.json({ exito: true, datos: { votacion } }, { status: 200 });
  } catch (err: any) {
    const estado = err.message === 'Votación no encontrada' ? 404 : 403;
    return NextResponse.json({ exito: false, mensaje: err.message }, { status: estado });
  }
}

// ── POST /api/votaciones/[id]/votar ──────────────────────
export async function controladorEmitirVoto(req: NextRequest, params: { id: string }) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { decision } = await req.json();
    if (!['aprobar', 'rechazar'].includes(decision)) {
      return NextResponse.json({ exito: false, mensaje: 'decision debe ser: aprobar o rechazar' }, { status: 400 });
    }

    const deps = crearDependencias();
    const votacion = await emitirVoto(
      params.id, payload!.idUsuario, decision,
      deps.votacionRepo, deps.miembroGrupoRepo,
    );

    const mensaje = votacion.estado === 'resuelta'
      ? `Votación resuelta: ${votacion.resultado}`
      : 'Voto registrado correctamente';

    return NextResponse.json({ exito: true, mensaje, datos: { votacion } }, { status: 200 });
  } catch (err: any) {
    const estado = err.message === 'Votación no encontrada' ? 404
      : err.message.includes('resuelta') || err.message.includes('emitiste') ? 409 : 403;
    return NextResponse.json({ exito: false, mensaje: err.message }, { status: estado });
  }
}
