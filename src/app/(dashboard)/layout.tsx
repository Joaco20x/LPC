"use client";

import "./dashboard.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  limpiarSesion,
  obtenerDatosUsuario,
} from "@/shared/servicios/almacenamientoTokens";
import CampanaNotificaciones from "@/notificaciones/components/CampanaNotificaciones";

export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [nombreUsuario] = useState(
    () => obtenerDatosUsuario()?.nombre || "Usuario",
  );

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
          {/* ── Campana de notificaciones ── */}
          <CampanaNotificaciones />

          <span className="dashboard-nav__nombre">{nombreUsuario}</span>
          <button
            onClick={manejarCerrarSesion}
            className="dashboard-nav__cerrar-sesion"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
