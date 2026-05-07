'use client';

// Página de inicio de sesión — FR-01
// Patrón: Componente de página delgado, delega lógica al hook y validaciones

import Link from 'next/link';
import { useFormulario } from '@/lib/validaciones/useFormulario';
import { validarInicioSesion } from '@/lib/validaciones/autenticacion';
import CampoEntrada from '@/components/autenticacion/CampoEntrada';
import BotonOAuth from '@/components/autenticacion/BotonOAuth';
import Separador from '@/components/autenticacion/Separador';
import type { DatosInicioSesion, ProveedorOAuth } from '@/types/autenticacion';
import { redirect } from 'next/navigation';

const VALORES_INICIALES: DatosInicioSesion = {
  correo: '',
  contrasena: '',
};

export default function PaginaInicioSesion() {
  const [estado, acciones] = useFormulario<DatosInicioSesion>(VALORES_INICIALES);
  const { datos, errores, cargando } = estado;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const erroresValidacion = validarInicioSesion(datos);
    if (erroresValidacion.length > 0) {
      acciones.establecerErrores(erroresValidacion);
      return;
    }

    acciones.establecerCargando(true);

    try {
      // TODO: Conectar con API route /api/auth/login
      await new Promise((res) => setTimeout(res, 1000)); // Simulación
      console.log('Iniciar sesión con:', datos.correo);
    } catch {
      acciones.establecerErrores([
        { campo: 'correo', mensaje: 'Correo o contraseña incorrectos' },
      ]);
    } finally {
      acciones.establecerCargando(false);
    }
  };

  const manejarOAuth = (proveedor: ProveedorOAuth) => {
    // TODO: Conectar con NextAuth o proveedor OAuth
    console.log('OAuth con:', proveedor);
  };

  return (
    <>
      <header className="auth-encabezado">
        <span className="auth-marca-movil">LPC</span>
        <h1 className="auth-titulo">Bienvenido de vuelta</h1>
        <p className="auth-subtitulo">Ingresa a tu cuenta para continuar</p>
      </header>

      <div className="auth-oauth-grupo">
        <BotonOAuth
          proveedor="google"
          onClick={() => manejarOAuth('google')}
          cargando={cargando}
        />
        <BotonOAuth
          proveedor="apple"
          onClick={() => manejarOAuth('apple')}
          cargando={cargando}
        />
      </div>

      <Separador texto="o continúa con correo" />

      <form onSubmit={manejarEnvio} noValidate className="auth-formulario">
        <CampoEntrada
          id="correo"
          etiqueta="Correo electrónico"
          tipo="email"
          valor={datos.correo}
          error={errores.correo}
          placeholder="tu@correo.com"
          autoComplete="email"
          onChange={(valor) => acciones.actualizarCampo('correo', valor)}
        />

        <div>
          <CampoEntrada
            id="contrasena"
            etiqueta="Contraseña"
            tipo="password"
            valor={datos.contrasena}
            error={errores.contrasena}
            placeholder="••••••••"
            autoComplete="current-password"
            onChange={(valor) => acciones.actualizarCampo('contrasena', valor)}
          />
          <Link href="/recuperar-contrasena" className="auth-link-contrasena">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className={`boton-primario${cargando ? ' boton-primario--cargando' : ''}`}
        >
          {cargando ? '' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-enlace-alternativo">
        ¿No tienes cuenta?{' '}
        <Link href="/registro">Crear cuenta</Link>
      </p>
    </>
  );
  
}