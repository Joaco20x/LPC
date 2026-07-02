"use client";

// Hook que encapsula toda la lógica del calendario de gastos
// Filtrado por categoría e integrante, navegación entre meses, detalle de día

import { useState, useEffect, useMemo } from "react";
import { obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";
import type { GastoConRelaciones } from "@/gastos/repositories/IGastoRepository";
import { calcularTotalDia } from "@/gastos/utils/calcularTotalDia";

export const CATEGORIAS = [
  "Alojamiento",
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Otros",
] as const;

export const COLOR_CATEGORIA: Record<string, string> = {
  Alojamiento: "#4a7c6f",
  Comida: "#c47a3a",
  Transporte: "#5a6fa8",
  Entretenimiento: "#9b5a9b",
  Otros: "#7a7a7a",
};

export interface DiaCalendario {
  fecha: Date;
  gastos: GastoConRelaciones[];
  totalMonto: number;
  categoriasPrincipal: string[];
  esHoy: boolean;
  esMesActual: boolean;
}

export function useCalendarioGastos(idGrupo: string, monedaBase: string) {
  const [gastos, setGastos] = useState<GastoConRelaciones[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroIntegrante, setFiltroIntegrante] = useState<string>("todos");
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaCalendario | null>(
    null,
  );
  const [tasas, setTasas] = useState<Map<string, number>>(new Map());

  // Cargar gastos del grupo
  useEffect(() => {
    if (!idGrupo) return;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const token = obtenerAccessToken();
        const res = await fetch(`/api/gastos?idGrupo=${idGrupo}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al cargar gastos");
        const data = await res.json();
        setGastos(data.datos ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [idGrupo]);

  // Integrantes únicos del grupo (extraídos de los gastos)
  const integrantes = useMemo(() => {
    const mapa = new Map<string, string>();
    gastos.forEach((g) => {
      mapa.set(g.pagador.id, g.pagador.nombre);
      g.divisiones.forEach((d) => mapa.set(d.usuario.id, d.usuario.nombre));
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [gastos]);

  // Gastos filtrados por categoría e integrante
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const pasaCategoria =
        filtroCategoria === "todas" || g.categoria === filtroCategoria;
      const pasaIntegrante =
        filtroIntegrante === "todos" ||
        g.idPagador === filtroIntegrante ||
        g.divisiones.some((d) => d.idUsuario === filtroIntegrante);
      return pasaCategoria && pasaIntegrante;
    });
  }, [gastos, filtroCategoria, filtroIntegrante]);

  // Obtener tasas de cambio para monedas distintas a la base
  useEffect(() => {
    const monedasUnicas = [
      ...new Set(
        gastosFiltrados
          .map((g) => g.moneda)
          .filter((m): m is string => Boolean(m)),
      ),
    ];
    const monedasAConvertir = monedasUnicas.filter((m) => m !== monedaBase);
    if (monedasAConvertir.length === 0) return;

    const token = obtenerAccessToken();
    let cancelado = false;

    async function cargarTasas() {
      const entradas = await Promise.all(
        monedasAConvertir.map(async (from) => {
          try {
            const res = await fetch(
              `/api/tasas-cambio?from=${from}&to=${monedaBase}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) return [from, 1] as const;
            const data = await res.json();
            return [from, data.datos?.tasa ?? 1] as const;
          } catch {
            return [from, 1] as const;
          }
        }),
      );
      if (!cancelado) setTasas(new Map(entradas));
    }

    cargarTasas();
    return () => {
      cancelado = true;
    };
  }, [gastosFiltrados, monedaBase]);

  // Construir la cuadrícula del mes
  const diasCalendario = useMemo((): DiaCalendario[] => {
    const hoy = new Date();
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    const inicioSemana = (primerDia.getDay() + 6) % 7;

    const dias: DiaCalendario[] = [];

    for (let i = inicioSemana - 1; i >= 0; i--) {
      const fecha = new Date(año, mes, -i);
      dias.push(
        construirDia(fecha, gastosFiltrados, hoy, false, monedaBase, tasas),
      );
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = new Date(año, mes, d);
      dias.push(
        construirDia(fecha, gastosFiltrados, hoy, true, monedaBase, tasas),
      );
    }

    const restantes = 7 - (dias.length % 7);
    if (restantes < 7) {
      for (let d = 1; d <= restantes; d++) {
        const fecha = new Date(año, mes + 1, d);
        dias.push(
          construirDia(fecha, gastosFiltrados, hoy, false, monedaBase, tasas),
        );
      }
    }

    return dias;
  }, [mesActual, gastosFiltrados, monedaBase, tasas]);

  function irMesAnterior() {
    setMesActual((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
    setDiaSeleccionado(null);
  }

  function irMesSiguiente() {
    setMesActual((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
    setDiaSeleccionado(null);
  }

  return {
    cargando,
    error,
    mesActual,
    diasCalendario,
    filtroCategoria,
    filtroIntegrante,
    integrantes,
    diaSeleccionado,
    setFiltroCategoria,
    setFiltroIntegrante,
    setDiaSeleccionado,
    irMesAnterior,
    irMesSiguiente,
  };
}

function construirDia(
  fecha: Date,
  gastos: GastoConRelaciones[],
  hoy: Date,
  esMesActual: boolean,
  monedaBase: string,
  tasas: Map<string, number>,
): DiaCalendario {
  const gastosDelDia = gastos.filter((g) => {
    const f = new Date(g.creadoEn);
    return (
      f.getDate() === fecha.getDate() &&
      f.getMonth() === fecha.getMonth() &&
      f.getFullYear() === fecha.getFullYear()
    );
  });

  const totalMonto = calcularTotalDia(gastosDelDia, monedaBase, tasas);

  const categoriasPrincipal = [
    ...new Set(gastosDelDia.map((g) => g.categoria)),
  ].slice(0, 3);

  const esHoy =
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear();

  return {
    fecha,
    gastos: gastosDelDia,
    totalMonto,
    categoriasPrincipal,
    esHoy,
    esMesActual,
  };
}
