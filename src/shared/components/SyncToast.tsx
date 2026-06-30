"use client";

import { useState, useEffect } from "react";

interface SyncToastProps {
  exitosos: number;
  errores: string[];
  onCerrar: () => void;
}

export default function SyncToast({
  exitosos,
  errores,
  onCerrar,
}: SyncToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCerrar();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onCerrar]);

  if (!visible) return null;

  const hayErrores = errores.length > 0;

  return (
    <div
      className={`sync-toast ${hayErrores ? "sync-toast--error" : "sync-toast--exito"}`}
    >
      <div className="sync-toast-contenido">
        {hayErrores ? (
          <>
            <span className="sync-toast-icono">⚠️</span>
            <span>
              {exitosos > 0
                ? `${exitosos} sincronizados, ${errores.length} con error`
                : `${errores.length} operaciones fallaron`}
            </span>
          </>
        ) : (
          <>
            <span className="sync-toast-icono">✅</span>
            <span>
              {exitosos > 0
                ? `${exitosos} registro${exitosos !== 1 ? "s" : ""} sincronizado${exitosos !== 1 ? "s" : ""}`
                : "Sin cambios pendientes"}
            </span>
          </>
        )}
      </div>
      <button
        className="sync-toast-cerrar"
        onClick={() => {
          setVisible(false);
          onCerrar();
        }}
      >
        ✕
      </button>
    </div>
  );
}
