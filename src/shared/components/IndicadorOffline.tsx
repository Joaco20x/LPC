"use client";

import { useSyncExternalStore } from "react";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import {
  obtenerCantidadPendientes,
  suscribirCola,
} from "@/shared/servicios/colaOffline";

export default function IndicadorOffline() {
  const online = useOnlineStatus();
  const pendientes = useSyncExternalStore(
    suscribirCola,
    obtenerCantidadPendientes,
    () => 0,
  );

  if (online && pendientes === 0) return null;

  return (
    <span
      className={`indicador-offline ${online ? "indicador-offline--online" : "indicador-offline--offline"}`}
      title={
        online
          ? `${pendientes} operaciones pendientes por sincronizar`
          : "Sin conexión"
      }
    >
      <span className="indicador-offline-punto" />
      {!online && <span className="indicador-offline-texto">Offline</span>}
      {online && pendientes > 0 && (
        <span className="indicador-offline-texto">{pendientes}</span>
      )}
    </span>
  );
}
