// Hook de división de gasto — SRP: lógica de estado UI separada del componente
// Responsabilidad: manejar estado local, calcular preview de divisiones y enviar datos a api_dor
// NO importar desde backend — este hook pertenece exclusivamente al frontend

import { useState, useEffect, useCallback } from 'react';
import type { TipoDivision, CategoriaGasto, IntegranteUI, DatosRegistroGasto, DivisionIntegrante } from '@/shared/types/gastos';
import { validarRegistroGasto } from '@/shared/validaciones/gastos';

function calcularDivisiones(
  monto: number,
  integrantes: string[],
  tipo: TipoDivision,
  porcentajes?: Record<string, number>,
  manuales?: Record<string, number>
): DivisionIntegrante[] {
  if (!integrantes.length) return [];
  switch (tipo) {
    case 'equitativa': {
      const base = Math.floor((monto / integrantes.length) * 100) / 100;
      const resto = Math.round((monto - base * integrantes.length) * 100) / 100;
      return integrantes.map((id, i) => ({ idUsuario: id, montoAsignado: i === 0 ? base + resto : base }));
    }
    case 'porcentual':
      return integrantes.map((id) => ({ idUsuario: id, montoAsignado: Math.round(((monto * (porcentajes?.[id] ?? 0)) / 100) * 100) / 100, porcentaje: porcentajes?.[id] ?? 0 }));
    case 'manual':
      return integrantes.map((id) => ({ idUsuario: id, montoAsignado: manuales?.[id] ?? 0 }));
  }
}

interface PropsHook {
  idGrupo: string;
  integrantes: IntegranteUI[];
  descripcion: string;
  categoria: CategoriaGasto;
  onGuardado?: (idGasto: string) => void;
}

export function useDivisionGasto({ idGrupo, integrantes, descripcion, categoria, onGuardado }: PropsHook) {
  const [monto,       setMonto      ] = useState('');
  const [idPagador,   setIdPagador  ] = useState(integrantes[0]?.id ?? '');
  const [modo,        setModo       ] = useState<TipoDivision>('equitativa');
  const [incluidos,   setIncluidos  ] = useState<Set<string>>(new Set(integrantes.map((m) => m.id)));
  const [porcentajes, setPorcentajes] = useState<Record<string, number>>({});
  const [manuales,    setManuales   ] = useState<Record<string, number>>({});
  const [guardado,    setGuardado   ] = useState(false);
  const [cargando,    setCargando   ] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const total   = parseFloat(monto) || 0;
  const activos = integrantes.filter((m) => incluidos.has(m.id));

  useEffect(() => {
    if (modo !== 'porcentual' || !activos.length) return;
    const base = Math.floor(100 / activos.length);
    const resto = 100 - base * activos.length;
    const sig: Record<string, number> = {};
    activos.forEach((m, i) => { sig[m.id] = base + (i === 0 ? resto : 0); });
    setPorcentajes(sig);
  }, [modo, incluidos]);

  useEffect(() => {
    if (modo !== 'manual' || !activos.length || !total) return;
    const base = Math.floor(total / activos.length);
    const resto = total - base * activos.length;
    const sig: Record<string, number> = {};
    activos.forEach((m, i) => { sig[m.id] = base + (i === 0 ? resto : 0); });
    setManuales(sig);
  }, [modo, incluidos, total]);

  const toggleIntegrante = (id: string) => {
    if (id === idPagador) return;
    setIncluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size <= 1) return prev; next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const obtenerMonto = useCallback((id: string): number => {
    if (!incluidos.has(id)) return 0;
    const divisiones = calcularDivisiones(total, activos.map((m) => m.id), modo, porcentajes, manuales);
    return divisiones.find((d) => d.idUsuario === id)?.montoAsignado ?? 0;
  }, [total, activos, modo, porcentajes, manuales, incluidos]);

  const sumaPct    = activos.reduce((s, m) => s + (porcentajes[m.id] ?? 0), 0);
  const sumaManual = activos.reduce((s, m) => s + (manuales[m.id] ?? 0), 0);
  const errorPct    = modo === 'porcentual' && Math.round(sumaPct) !== 100;
  const errorManual = modo === 'manual' && total > 0 && Math.round(sumaManual) !== Math.round(total);

  const ajustarResto = () => {
    if (errorPct) { const id = activos[0]?.id; if (id) setPorcentajes((p) => ({ ...p, [id]: (p[id] ?? 0) + (100 - sumaPct) })); }
    if (errorManual) { const id = activos[0]?.id; if (id) setManuales((m) => ({ ...m, [id]: (m[id] ?? 0) + (total - sumaManual) })); }
  };

  const esValido = total > 0 && activos.length > 0 && !errorPct && !errorManual;

  const manejarGuardar = async () => {
    if (!esValido || cargando) return;
    const divisiones = calcularDivisiones(total, activos.map((m) => m.id), modo, porcentajes, manuales);
    const datos: DatosRegistroGasto = { idGrupo, idPagador, monto: total, descripcion, categoria, tipoDivision: modo, divisiones };
    const errores = validarRegistroGasto(datos);
    if (errores.length) { setErrorGlobal(errores[0].mensaje); return; }

    setCargando(true);
    setErrorGlobal(null);
    try {
      const res  = await fetch('/api_dor/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const json = await res.json();
      if (json.exito) { setGuardado(true); onGuardado?.(json.idGasto); setTimeout(() => setGuardado(false), 2200); }
      else setErrorGlobal(json.mensaje);
    } catch { setErrorGlobal('Error de conexión. Intenta de nuevo.'); }
    finally { setCargando(false); }
  };

  const limpiar = () => {
    setMonto('');
    setIncluidos(new Set(integrantes.map((m) => m.id)));
    setModo('equitativa');
    setErrorGlobal(null);
  };

  return {
    monto, setMonto,
    idPagador, setIdPagador,
    modo, setModo,
    incluidos, toggleIntegrante,
    porcentajes, setPorcentajes,
    manuales, setManuales,
    obtenerMonto,
    sumaPct, sumaManual,
    errorPct, errorManual,
    ajustarResto,
    esValido,
    guardado, cargando, errorGlobal,
    manejarGuardar,
    limpiar,
    activos,
    total,
  };
}
