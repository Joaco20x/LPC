'use client';

// Hook reutilizable para formularios - Principio DRY + SRP
import { useState, useCallback } from 'react';
import type { ErrorCampo } from '@/shared/types/autenticacion';

interface EstadoFormulario<T> {
  datos: T;
  errores: Record<string, string>;
  cargando: boolean;
  enviado: boolean;
}

interface AccionesFormulario<T> {
  actualizarCampo: (campo: keyof T, valor: string) => void;
  establecerCargando: (valor: boolean) => void;
  establecerEnviado: (valor: boolean) => void;
  establecerErrores: (errores: ErrorCampo[]) => void;
  limpiarError: (campo: string) => void;
}

export function useFormulario<T extends object>(
  valorInicial: T
): [EstadoFormulario<T>, AccionesFormulario<T>] {
  const [datos, setDatos] = useState<T>(valorInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const actualizarCampo = useCallback((campo: keyof T, valor: string) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => {
      const siguiente = { ...prev };
      delete siguiente[campo as string];
      return siguiente;
    });
  }, []);

  const establecerErrores = useCallback((listaErrores: ErrorCampo[]) => {
    const mapaErrores: Record<string, string> = {};
    listaErrores.forEach(({ campo, mensaje }) => {
      mapaErrores[campo] = mensaje;
    });
    setErrores(mapaErrores);
  }, []);

  const limpiarError = useCallback((campo: string) => {
    setErrores(prev => {
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  }, []);

  return [
    { datos, errores, cargando, enviado },
    {
      actualizarCampo,
      establecerCargando: setCargando,
      establecerEnviado: setEnviado,
      establecerErrores,
      limpiarError,
    },
  ];
}