'use client';

// Componente de división de gasto — (0b.0.4)
// SRP: solo renderiza y gestiona el estado local del formulario de división
// La lógica de cálculo vive en service.ts; la validación en lib/validaciones/gastos.ts

import { useState, useEffect, useCallback } from 'react';
import type {
  TipoDivision,
  CategoriaGasto,
  IntegranteUI,
  DatosRegistroGasto,
} from '@/types/gastos';
import { calcularDivisiones } from '@/app/api/gastos/service';
import { validarRegistroGasto } from '@/lib/validaciones/gastos';

// ── Datos mock — reemplazar con props desde la página padre ──

const INTEGRANTES_MOCK: IntegranteUI[] = [
  { id: 'u1', nombre: 'Valentina Rojas',  iniciales: 'VR', color: '#5DCAA5' },
  { id: 'u2', nombre: 'Matías Herrera',   iniciales: 'MH', color: '#7F77DD' },
  { id: 'u3', nombre: 'Sofía Méndez',     iniciales: 'SM', color: '#D85A30' },
  { id: 'u4', nombre: 'Tomás Fuentes',    iniciales: 'TF', color: '#378ADD' },
  { id: 'u5', nombre: 'Camila Torres',    iniciales: 'CT', color: '#D4537E' },
];

const CATEGORIAS: { id: CategoriaGasto; etiqueta: string; icono: string }[] = [
  { id: 'alojamiento', etiqueta: 'Alojamiento', icono: '🏨' },
  { id: 'transporte',  etiqueta: 'Transporte',  icono: '✈️' },
  { id: 'comida',      etiqueta: 'Comida',       icono: '🍽️' },
  { id: 'actividad',   etiqueta: 'Actividad',    icono: '🎯' },
  { id: 'otro',        etiqueta: 'Otro',          icono: '📦' },
];

const MODOS: { id: TipoDivision; etiqueta: string; icono: string }[] = [
  { id: 'equitativa', etiqueta: 'Equitativo',  icono: 'ti-equal'      },
  { id: 'porcentual', etiqueta: 'Porcentual',  icono: 'ti-percentage' },
  { id: 'manual',     etiqueta: 'Manual',      icono: 'ti-pencil'     },
];

// ── Props — para integrar con página real ─────────────────

interface PropsDivisionGasto {
  idGrupo: string;
  integrantes?: IntegranteUI[];   // si no se pasan, usa el mock
  onGuardado?: (idGasto: string) => void;
}

// ── Helpers ───────────────────────────────────────────────

function formatearCLP(n: number): string {
  if (isNaN(n)) return '$0';
  return '$' + Math.round(n).toLocaleString('es-CL');
}

// ── Componente ────────────────────────────────────────────

export default function DivisionGasto({
  idGrupo,
  integrantes = INTEGRANTES_MOCK,
  onGuardado,
}: PropsDivisionGasto) {
  const [monto,       setMonto      ] = useState('85000');
  const [descripcion, setDescripcion] = useState('');
  const [categoria,   setCategoria  ] = useState<CategoriaGasto>('comida');
  const [idPagador,   setIdPagador  ] = useState(integrantes[0]?.id ?? '');
  const [modo,        setModo       ] = useState<TipoDivision>('equitativa');
  const [incluidos,   setIncluidos  ] = useState<Set<string>>(
    new Set(integrantes.map((m) => m.id))
  );
  const [porcentajes, setPorcentajes] = useState<Record<string, number>>({});
  const [manuales,    setManuales   ] = useState<Record<string, number>>({});
  const [guardado,    setGuardado   ] = useState(false);
  const [cargando,    setCargando   ] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const total = parseFloat(monto) || 0;
  const activos = integrantes.filter((m) => incluidos.has(m.id));

  // Distribuir porcentajes equitativamente al cambiar selección o modo
  useEffect(() => {
    if (modo !== 'porcentual' || !activos.length) return;
    const base = Math.floor(100 / activos.length);
    const resto = 100 - base * activos.length;
    const siguiente: Record<string, number> = {};
    activos.forEach((m, i) => { siguiente[m.id] = base + (i === 0 ? resto : 0); });
    setPorcentajes(siguiente);
  }, [modo, incluidos]);

  // Distribuir montos manuales al cambiar selección, modo o total
  useEffect(() => {
    if (modo !== 'manual' || !activos.length || !total) return;
    const base = Math.floor(total / activos.length);
    const resto = total - base * activos.length;
    const siguiente: Record<string, number> = {};
    activos.forEach((m, i) => { siguiente[m.id] = base + (i === 0 ? resto : 0); });
    setManuales(siguiente);
  }, [modo, incluidos, total]);

  const toggleIntegrante = (id: string) => {
    if (id === idPagador) return; // el pagador siempre participa
    setIncluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const obtenerMonto = useCallback(
    (id: string): number => {
      if (!incluidos.has(id)) return 0;
      const divisiones = calcularDivisiones(
        total,
        activos.map((m) => m.id),
        modo,
        porcentajes,
        manuales
      );
      return divisiones.find((d) => d.idUsuario === id)?.montoAsignado ?? 0;
    },
    [total, activos, modo, porcentajes, manuales, incluidos]
  );

  const sumaPct    = activos.reduce((s, m) => s + (porcentajes[m.id] ?? 0), 0);
  const sumaManual = activos.reduce((s, m) => s + (manuales[m.id] ?? 0), 0);
  const errorPct    = modo === 'porcentual' && Math.round(sumaPct)    !== 100;
  const errorManual = modo === 'manual'     && total > 0 && Math.round(sumaManual) !== Math.round(total);

  const ajustarResto = () => {
    if (errorPct) {
      const diff = 100 - sumaPct;
      const id = activos[0]?.id;
      if (id) setPorcentajes((p) => ({ ...p, [id]: (p[id] ?? 0) + diff }));
    }
    if (errorManual) {
      const diff = total - sumaManual;
      const id = activos[0]?.id;
      if (id) setManuales((m) => ({ ...m, [id]: (m[id] ?? 0) + diff }));
    }
  };

  const esValido =
    total > 0 &&
    activos.length > 0 &&
    !errorPct &&
    !errorManual;

  const manejarGuardar = async () => {
    if (!esValido || cargando) return;

    const divisiones = calcularDivisiones(
      total,
      activos.map((m) => m.id),
      modo,
      porcentajes,
      manuales
    );

    const datos: DatosRegistroGasto = {
      idGrupo,
      idPagador,
      monto: total,
      descripcion,
      categoria,
      tipoDivision: modo,
      divisiones,
    };

    const errores = validarRegistroGasto(datos);
    if (errores.length) {
      setErrorGlobal(errores[0].mensaje);
      return;
    }

    setCargando(true);
    setErrorGlobal(null);

    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const json = await res.json();

      if (json.exito) {
        setGuardado(true);
        onGuardado?.(json.idGasto);
        setTimeout(() => setGuardado(false), 2200);
      } else {
        setErrorGlobal(json.mensaje);
      }
    } catch {
      setErrorGlobal('Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'var(--font-sans)', padding: '1rem 0', maxWidth: 640, margin: '0 auto' }}>

      {/* Detalle del gasto */}
      <div className="lpc-card" style={{ marginBottom: '1rem' }}>
        <p className="lpc-label-seccion">Detalle del gasto</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label className="lpc-label" htmlFor="descripcion">Descripción</label>
            <input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cena en restaurante"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label className="lpc-label" htmlFor="monto">Monto (CLP)</label>
            <input
              id="monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{ width: '100%', boxSizing: 'border-box', fontWeight: 500 }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="lpc-label" htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>{c.icono} {c.etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lpc-label" htmlFor="pagador">Pagador</label>
            <select
              id="pagador"
              value={idPagador}
              onChange={(e) => {
                setIdPagador(e.target.value);
                setIncluidos((s) => { const n = new Set(s); n.add(e.target.value); return n; });
              }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {integrantes.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modo de división */}
      <div className="lpc-card" style={{ marginBottom: '1rem' }}>
        <p className="lpc-label-seccion">Método de división</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {MODOS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              aria-pressed={modo === m.id}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 8px', borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
                border: modo === m.id ? '1.5px solid var(--color-border-info)' : '0.5px solid var(--color-border-tertiary)',
                background: modo === m.id ? 'var(--color-background-info)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <i className={`ti ${m.icono}`} style={{ fontSize: 18, color: modo === m.id ? 'var(--color-text-info)' : 'var(--color-text-secondary)' }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: modo === m.id ? 500 : 400, color: modo === m.id ? 'var(--color-text-info)' : 'var(--color-text-secondary)' }}>
                {m.etiqueta}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Integrantes */}
      <div className="lpc-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="lpc-label-seccion" style={{ margin: 0 }}>Integrantes</p>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {activos.length} de {integrantes.length} incluidos
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {integrantes.map((integrante) => {
            const estaIncluido = incluidos.has(integrante.id);
            const esPagador    = integrante.id === idPagador;
            const montoAsignado = obtenerMonto(integrante.id);

            return (
              <div
                key={integrante.id}
                onClick={() => toggleIntegrante(integrante.id)}
                role="checkbox"
                aria-checked={estaIncluido}
                aria-label={integrante.nombre}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleIntegrante(integrante.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
                  border: estaIncluido ? `0.5px solid ${integrante.color}44` : '0.5px solid var(--color-border-tertiary)',
                  background: estaIncluido ? integrante.color + '08' : 'transparent',
                  opacity: estaIncluido ? 1 : 0.45,
                  cursor: esPagador ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: integrante.color + '22', border: `1.5px solid ${integrante.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: integrante.color,
                }}>
                  {integrante.iniciales}
                </div>

                {/* Nombre + badge pagador */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {integrante.nombre}
                    </span>
                    {esPagador && (
                      <span style={{ fontSize: 10, background: integrante.color + '22', color: integrante.color, padding: '1px 6px', borderRadius: 'var(--border-radius-md)', fontWeight: 500 }}>
                        PAGÓ
                      </span>
                    )}
                  </div>
                </div>

                {/* Input según modo */}
                {estaIncluido && modo === 'porcentual' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number" min="0" max="100"
                      value={porcentajes[integrante.id] ?? ''}
                      onChange={(e) => setPorcentajes((p) => ({ ...p, [integrante.id]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                      aria-label={`Porcentaje de ${integrante.nombre}`}
                      style={{ width: 52, textAlign: 'right', fontWeight: 500 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>%</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>{formatearCLP(montoAsignado)}</span>
                  </div>
                )}

                {estaIncluido && modo === 'manual' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>$</span>
                    <input
                      type="number" min="0"
                      value={manuales[integrante.id] ?? ''}
                      onChange={(e) => setManuales((m) => ({ ...m, [integrante.id]: Math.max(0, parseFloat(e.target.value) || 0) }))}
                      aria-label={`Monto de ${integrante.nombre}`}
                      style={{ width: 80, textAlign: 'right', fontWeight: 500 }}
                    />
                  </div>
                )}

                {estaIncluido && modo === 'equitativa' && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {formatearCLP(montoAsignado)}
                  </span>
                )}

                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: estaIncluido ? `1.5px solid ${integrante.color}` : '1.5px solid var(--color-border-secondary)',
                  background: estaIncluido ? integrante.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {estaIncluido && <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerta de validación de divisiones */}
        {(errorPct || errorManual) && (
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-warning)', border: '0.5px solid var(--color-border-warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 15, color: 'var(--color-text-warning)' }} aria-hidden="true" />
              <span style={{ fontSize: 12, color: 'var(--color-text-warning)', fontWeight: 500 }}>
                {errorPct
                  ? `Porcentajes suman ${sumaPct}% — deben sumar 100%`
                  : `Suma manual ${formatearCLP(sumaManual)} de ${formatearCLP(total)}`}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); ajustarResto(); }} style={{ fontSize: 11, padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--color-border-warning)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-text-warning)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ajustar diferencia
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <p className="lpc-label-seccion">Resumen de distribución</p>
        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--color-border-tertiary)', display: 'flex', marginBottom: 12 }}>
          {total > 0 && activos.map((m) => {
            const pct = (obtenerMonto(m.id) / total) * 100;
            return <div key={m.id} style={{ width: `${pct}%`, background: m.color, transition: 'width 0.3s' }} title={m.nombre} />;
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          {activos.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nombre.split(' ')[0]}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{formatearCLP(obtenerMonto(m.id))}</p>
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--border-radius-md)', fontWeight: 500, flexShrink: 0, background: m.id === idPagador ? '#5DCAA522' : '#D85A3011', color: m.id === idPagador ? '#0F6E56' : '#993C1D' }}>
                {m.id === idPagador ? 'recibe' : 'debe'}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 500 }}>{formatearCLP(total)}</span>
        </div>
      </div>

      {/* Error global */}
      {errorGlobal && (
        <p style={{ fontSize: 13, color: 'var(--color-text-error)', marginBottom: 8, textAlign: 'center' }} role="alert">
          {errorGlobal}
        </p>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { setMonto(''); setDescripcion(''); setIncluidos(new Set(integrantes.map((m) => m.id))); setModo('equitativa'); setErrorGlobal(null); }}
          style={{ flex: 1, padding: '10px', fontSize: 14, color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: 'transparent' }}
        >
          Limpiar
        </button>
        <button
          onClick={manejarGuardar}
          disabled={!esValido || cargando}
          style={{
            flex: 2, padding: '10px', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderRadius: 'var(--border-radius-md)', border: guardado ? '0.5px solid var(--color-border-success)' : 'none',
            cursor: esValido && !cargando ? 'pointer' : 'not-allowed',
            background: guardado ? 'var(--color-background-success)' : esValido ? 'var(--color-text-primary)' : 'var(--color-border-tertiary)',
            color: guardado ? 'var(--color-text-success)' : esValido ? 'var(--color-background-primary)' : 'var(--color-text-tertiary)',
            transition: 'all 0.2s',
          }}
        >
          {cargando && <i className="ti ti-loader-2" style={{ fontSize: 16 }} aria-hidden="true" />}
          {guardado  && <><i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" /> Gasto registrado</>}
          {!cargando && !guardado && <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} aria-hidden="true" /> Guardar gasto</>}
        </button>
      </div>
    </div>
  );
}
