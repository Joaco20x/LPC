
'use client';

import './dashboard.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { limpiarSesion, obtenerDatosUsuario } from '@/shared/servicios/almacenamientoTokens';

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  // Acceder a localStorage solo en el cliente (evita error de SSR)
  useEffect(() => {
    const datos = obtenerDatosUsuario();
    setNombreUsuario(datos?.nombre || 'Usuario');
  }, []);

  const manejarCerrarSesion = () => {
    limpiarSesion();
    router.push('/login');
  };

  return (
    <div className="dashboard-raiz">
      <nav className="dashboard-nav">
        <div className="dashboard-nav__izquierda">
          <span className="dashboard-nav__marca">LPC</span>
          <div className="dashboard-nav__links">
            <Link href="/dashboard" className="dashboard-nav__link">Inicio</Link>
            <Link href="/gastos" className="dashboard-nav__link">Gastos</Link>
            <Link href="/deudas" className="dashboard-nav__link">Deudas</Link>
          </div>
        </div>
        <div className="dashboard-nav__usuario">
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