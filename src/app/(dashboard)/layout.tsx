"use client";

import "./dashboard.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState, useEffect } from "react";
import {
  limpiarSesion,
  obtenerDatosUsuario,
} from "@/shared/servicios/almacenamientoTokens";
import CampanaNotificaciones from "@/notificaciones/components/CampanaNotificaciones";
import { useRefrescoActivo } from "@/auth/components/useRefrescoActivo";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import {
  procesarCola,
  obtenerCantidadPendientes,
  suscribirCola,
} from "@/shared/servicios/colaOffline";
import IndicadorOffline from "@/shared/components/IndicadorOffline";
import SyncToast from "@/shared/components/SyncToast";

export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  useRefrescoActivo();
  const router = useRouter();
  const online = useOnlineStatus();
  const [resultadoSync, setResultadoSync] = useState<{
    exitosos: number;
    errores: string[];
  } | null>(null);
  const nombreUsuario = useSyncExternalStore(
    () => () => {},
    () => obtenerDatosUsuario()?.nombre ?? "Usuario",
    () => null,
  );

  const pendientes = useSyncExternalStore(
    suscribirCola,
    obtenerCantidadPendientes,
    () => 0,
  );

  useEffect(() => {
    if (online && pendientes > 0) {
      procesarCola().then((resultado) => {
        if (resultado.exitosos > 0 || resultado.errores.length > 0) {
          setResultadoSync(resultado);
        }
      });
    }
  }, [online, pendientes]);

  const manejarCerrarSesion = () => {
    limpiarSesion();
    router.push("/login");
  };

  return (
    <div className="dashboard-raiz">
      <nav className="dashboard-nav">
        <div className="dashboard-nav__izquierda">
          <span className="dashboard-nav__marca">LPC</span>
          <div className="dashboard-nav__links">
            <Link href="/dashboard" className="dashboard-nav__link">
              Inicio
            </Link>
            <Link href="/gastos" className="dashboard-nav__link">
              Gastos
            </Link>
            <Link href="/deudas" className="dashboard-nav__link">
              Deudas
            </Link>
          </div>
        </div>
        <div className="dashboard-nav__usuario">
          <IndicadorOffline />
          <CampanaNotificaciones />
          <span className="dashboard-nav__nombre">{nombreUsuario ?? ""}</span>
          <button
            onClick={manejarCerrarSesion}
            className="dashboard-nav__cerrar-sesion"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      {resultadoSync && (
        <SyncToast
          exitosos={resultadoSync.exitosos}
          errores={resultadoSync.errores}
          onCerrar={() => setResultadoSync(null)}
        />
      )}
      {children}
    </div>
  );
}
