'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { peticionAutenticada } from '@/shared/servicios/peticionAutenticada';
import { obtenerDatosUsuario } from '@/shared/servicios/almacenamientoTokens';
import './detalles.css';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  creadoEn: string;
  pagador: { nombre: string };
}

interface Integrante {
  rol: string;
  idUsuario: string;
  usuario: { id: string; nombre: string; correo: string };
}

interface GrupoDetalle {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  monedaBase: string;
  miembros: Integrante[];
  gastos: Gasto[];
}

interface Invitacion {
  id: string;
  token: string;
  tipo: string;
  correoInvitado: string | null;
  expiraEn: string;
  estado: 'pendiente' | 'aceptada' | 'expirada';
  creadoEn: string;
}

type TipoInvit = 'correo' | 'enlace' | 'qr';

export default function PaginaDetalleGrupo() {
  const { id } = useParams();
  const [grupo, setGrupo] = useState<GrupoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Panel de invitaciones
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [cargandoInvit, setCargandoInvit] = useState(false);
  const [tipoInvit, setTipoInvit] = useState<TipoInvit>('enlace');
  const [correoInvit, setCorreoInvit] = useState('');
  const [expiraHoras, setExpiraHoras] = useState(24);
  const [creandoInvit, setCreandoInvit] = useState(false);
  const [mensajeInvit, setMensajeInvit] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [enlaceGenerado, setEnlaceGenerado] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const usuarioActual = obtenerDatosUsuario();

  useEffect(() => {
    if (id) cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    setCargando(true);
    try {
      const res = await peticionAutenticada(`/api/grupos/${id}`);
      const data = await res.json();
      if (data.exito) {
        setGrupo(data.datos.grupo);
      } else {
        setError(data.mensaje || 'Error al cargar el grupo');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const esAdmin = grupo?.miembros.some(
    (m) => m.idUsuario === usuarioActual?.id && m.rol === 'admin',
  ) ?? false;

  const cargarInvitaciones = async () => {
    setCargandoInvit(true);
    try {
      const res = await peticionAutenticada(`/api/grupos/${id}/invitaciones`);
      const data = await res.json();
      if (data.exito) setInvitaciones(data.datos.invitaciones);
    } catch {
      // silencioso
    } finally {
      setCargandoInvit(false);
    }
  };

  const abrirPanel = () => {
    setMostrarPanel(true);
    cargarInvitaciones();
  };

  const generarInvitacion = async () => {
    setCreandoInvit(true);
    setMensajeInvit(null);
    setEnlaceGenerado(null);
    setQrDataUrl(null);

    try {
      const res = await peticionAutenticada(`/api/grupos/${id}/invitaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoInvit,
          correoInvitado: tipoInvit === 'correo' ? correoInvit : undefined,
          expiraHoras,
        }),
      });
      const data = await res.json();

      if (data.exito) {
        const enlace = data.datos.enlace as string;
        setEnlaceGenerado(enlace);

        if (tipoInvit === 'qr') {
          // Generar QR con la librería qrcode
          const dataUrl = await QRCode.toDataURL(enlace, {
            width: 300,
            margin: 2,
            color: { dark: '#2d4a3e', light: '#ffffff' },
          });
          setQrDataUrl(dataUrl);
        }

        setMensajeInvit({ tipo: 'ok', texto: tipoInvit === 'correo' ? 'Correo de invitación enviado correctamente.' : 'Invitación creada correctamente.' });
        cargarInvitaciones();
        if (tipoInvit === 'correo') setCorreoInvit('');
      } else {
        setMensajeInvit({ tipo: 'error', texto: data.mensaje || 'Error al crear la invitación' });
      }
    } catch {
      setMensajeInvit({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setCreandoInvit(false);
    }
  };

  const copiarEnlace = (enlace: string) => {
    navigator.clipboard.writeText(enlace);
  };

  const descargarQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `invitacion-${grupo?.nombre ?? 'grupo'}.png`;
    a.click();
  };

  const badgeEstado = (estado: string) => {
    const estilos: Record<string, { bg: string; color: string; label: string }> = {
      pendiente: { bg: '#edf4f1', color: '#2d4a3e', label: 'Pendiente' },
      aceptada: { bg: '#f0f0f0', color: '#6b6b67', label: 'Aceptada' },
      expirada: { bg: '#fef0f0', color: '#c0392b', label: 'Expirada' },
    };
    const s = estilos[estado] ?? estilos.pendiente;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  if (cargando) return <div className="dashboard-cuerpo"><p>Cargando detalles...</p></div>;
  if (error || !grupo) return <div className="dashboard-cuerpo"><p className="auth-mensaje--error">{error || 'No se encontró el grupo'}</p></div>;

  const totalGastado = grupo.gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  const formatearMonto = (m: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(m);

  return (
    <div className="dashboard-cuerpo detalles-grupo-raiz">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-texto-principal)' }}>{grupo.nombre}</span>
      </nav>

      {/* Cabecera */}
      <header className="cabecera-grupo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="dashboard-encabezado__titulo">{grupo.nombre}</h1>
          <p className="dashboard-encabezado__descripcion">
            {grupo.destino} • {formatearFecha(grupo.fechaInicio)} al {formatearFecha(grupo.fechaFin)}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={abrirPanel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', background: '#2d4a3e', color: '#fff',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Gestionar invitaciones
          </button>
        )}
      </header>

      <div className="grid-detalles">
        {/* Columna Principal: Gastos */}
        <main>
          <div className="seccion-detalles">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="titulo-seccion" style={{ margin: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Historial de Gastos
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link href={`/gastos?grupo=${grupo.id}`} className="boton-solido" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem' }}>
                  + Nuevo Gasto
                </Link>
                <Link href={`/deudas?grupo=${grupo.id}`} className="boton-solido" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem', background: 'transparent', color: 'var(--color-acento)', border: '1px solid var(--color-acento)' }}>
                  Ver deudas
                </Link>
                <Link href={`/grupos/${grupo.id}/votaciones`} className="boton-solido" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem', background: 'transparent', color: 'var(--color-acento)', border: '1px solid var(--color-acento)' }}>
                  🗳️ Votaciones
                </Link>
              </div>
            </div>

            {grupo.gastos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-texto-suave)' }}>
                <p>Aún no hay gastos registrados en este viaje.</p>
              </div>
            ) : (
              <div className="lista-gastos">
                {grupo.gastos.map((gasto) => (
                  <div key={gasto.id} className="gasto-item">
                    <div className="gasto-info-principal">
                      <span className="gasto-descripcion">{gasto.descripcion}</span>
                      <span className="gasto-meta">
                        Pagado por <strong>{gasto.pagador.nombre}</strong> • {new Date(gasto.creadoEn).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="gasto-monto">{formatearMonto(Number(gasto.monto))}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-suave)' }}>{gasto.categoria}</div>
                    </div>
                  </div>
                ))}
                <div className="gasto-item" style={{ borderTop: '2px solid var(--color-borde)', marginTop: '0.5rem', paddingTop: '1rem', fontWeight: 600 }}>
                  <div className="gasto-info-principal">
                    <span className="gasto-descripcion">Total del viaje</span>
                    <span className="gasto-meta">{grupo.gastos.length} gasto{grupo.gastos.length !== 1 ? 's' : ''} registrado{grupo.gastos.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="gasto-monto" style={{ color: 'var(--color-acento)', fontSize: '1.2rem' }}>
                      {formatearMonto(totalGastado)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Columna Lateral */}
        <aside>
          <div className="seccion-detalles" style={{ background: 'var(--color-acento)', color: 'white' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', opacity: 0.8 }}>Total Gastado</h3>
            <p style={{ fontSize: '2rem', fontWeight: '600', fontFamily: 'var(--fuente-display)' }}>{formatearMonto(totalGastado)}</p>
          </div>

          <div className="seccion-detalles">
            <h2 className="titulo-seccion" style={{ fontSize: '1.25rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Integrantes ({grupo.miembros.length})
            </h2>
            <div className="lista-miembros">
              {grupo.miembros.map((miembro) => (
                <div key={miembro.usuario.id} className="integrante-fila">
                  <div className="avatar-mini">{miembro.usuario.nombre.charAt(0)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                      {miembro.usuario.nombre} {miembro.rol === 'admin' && '(Admin)'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-suave)' }}>{miembro.usuario.correo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Modal: Panel de Invitaciones (solo Admin) ────────────────────────── */}
      {mostrarPanel && (
        <div className="invit-overlay" onClick={() => setMostrarPanel(false)}>
          <div className="invit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invit-modal__cabecera">
              <h2 style={{ fontFamily: 'var(--fuente-display)', fontSize: '1.5rem', margin: 0 }}>
                Gestionar Invitaciones
              </h2>
              <button onClick={() => setMostrarPanel(false)} className="invit-cerrar">✕</button>
            </div>

            {/* Formulario de nueva invitación */}
            <div className="invit-seccion">
              <h3 className="invit-seccion__titulo">Nueva Invitación</h3>

              {/* Selector de tipo */}
              <div className="invit-tipo-grupo">
                {(['correo', 'enlace', 'qr'] as TipoInvit[]).map((t) => {
                  const iconos = {
                    correo: '✉️',
                    enlace: '🔗',
                    qr: '📷',
                  };
                  const labels = {
                    correo: 'Por correo',
                    enlace: 'Enlace',
                    qr: 'Código QR',
                  };
                  return (
                    <button
                      key={t}
                      onClick={() => { setTipoInvit(t); setEnlaceGenerado(null); setQrDataUrl(null); setMensajeInvit(null); }}
                      className={`invit-tipo-btn${tipoInvit === t ? ' invit-tipo-btn--activo' : ''}`}
                    >
                      <span>{iconos[t]}</span>
                      <span>{labels[t]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo correo (solo tipo correo) */}
              {tipoInvit === 'correo' && (
                <input
                  type="email"
                  value={correoInvit}
                  onChange={(e) => setCorreoInvit(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="invit-input"
                />
              )}

              {/* Expiración */}
              <div style={{ marginTop: '0.75rem' }}>
                <label className="invit-label">Válida por</label>
                <select
                  value={expiraHoras}
                  onChange={(e) => setExpiraHoras(Number(e.target.value))}
                  className="invit-select"
                >
                  <option value={1}>1 hora</option>
                  <option value={6}>6 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={72}>3 días</option>
                  <option value={168}>7 días</option>
                  <option value={720}>30 días</option>
                </select>
              </div>

              <button
                onClick={generarInvitacion}
                disabled={creandoInvit || (tipoInvit === 'correo' && !correoInvit)}
                className="invit-boton-generar"
              >
                {creandoInvit ? 'Generando…' : 'Generar invitación'}
              </button>

              {/* Mensaje feedback */}
              {mensajeInvit && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: mensajeInvit.tipo === 'ok' ? '#2d4a3e' : '#c0392b' }}>
                  {mensajeInvit.texto}
                </p>
              )}

              {/* Resultado: enlace */}
              {enlaceGenerado && tipoInvit !== 'qr' && (
                <div className="invit-resultado">
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-texto-suave)', marginBottom: '0.5rem' }}>Enlace de invitación:</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input readOnly value={enlaceGenerado} className="invit-input" style={{ flex: 1, fontSize: '0.8125rem' }} />
                    <button onClick={() => copiarEnlace(enlaceGenerado)} className="invit-boton-copiar" title="Copiar">
                      📋
                    </button>
                  </div>
                </div>
              )}

              {/* Resultado: QR */}
              {qrDataUrl && tipoInvit === 'qr' && (
                <div className="invit-qr-container">
                  <img src={qrDataUrl} alt="Código QR de invitación" style={{ width: '200px', height: '200px', borderRadius: '0.5rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={descargarQR} className="invit-boton-generar" style={{ flex: 1 }}>
                      ⬇ Descargar PNG
                    </button>
                    <button onClick={() => copiarEnlace(enlaceGenerado!)} className="invit-boton-copiar" style={{ padding: '0.5rem 0.75rem' }}>
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de invitaciones existentes */}
            <div className="invit-seccion">
              <h3 className="invit-seccion__titulo">Invitaciones enviadas</h3>
              {cargandoInvit ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.875rem' }}>Cargando…</p>
              ) : invitaciones.length === 0 ? (
                <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.875rem' }}>No hay invitaciones aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {invitaciones.map((inv) => (
                    <div key={inv.id} className="invit-fila">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {inv.tipo === 'correo' ? `✉️ ${inv.correoInvitado}` : inv.tipo === 'qr' ? '📷 QR' : '🔗 Enlace'}
                          </span>
                          {badgeEstado(inv.estado)}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-texto-suave)' }}>
                          Creada {new Date(inv.creadoEn).toLocaleDateString('es-CL')} • Expira {new Date(inv.expiraEn).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      {inv.estado === 'pendiente' && (
                        <button
                          onClick={() => {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            copiarEnlace(`${baseUrl}/invitar/${inv.token}`);
                          }}
                          className="invit-boton-copiar"
                          title="Copiar enlace"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
