'use client';

// Página de recuperación de contraseña — FR-01

import Link from 'next/link';
import { useFormulario } from '@/shared/validaciones/useFormulario';
import { validarRecuperacion } from '@/shared/validaciones/autenticacion';
import { recuperarContrasena} from '@/shared/validaciones/servicioAuth';
import CampoEntrada from '@/frontend/components/autenticacion/CampoEntrada';
import type { DatosRecuperacion } from '@/shared/types/autenticacion';

const VALORES_INICIALES: DatosRecuperacion = { correo: '' };

export default function PaginaRecuperarContrasena() {
  const [estado, acciones] = useFormulario<DatosRecuperacion>(VALORES_INICIALES);
  const { datos, errores, cargando, enviado } = estado;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const erroresValidacion = validarRecuperacion(datos);
    if (erroresValidacion.length > 0) {
      acciones.establecerErrores(erroresValidacion);
      return;
    }

    acciones.establecerCargando(true);

    try {
      // El servidor siempre responde con éxito (no revela si el correo existe)
      await recuperarContrasena(datos);
      acciones.establecerEnviado(true);
    } catch {
      // Mostramos confirmación igualmente para no filtrar existencia del correo
      acciones.establecerEnviado(true);
    } finally {
      acciones.establecerCargando(false);
    }
  };

  if (enviado) {
    return (
      <div className="auth-confirmacion">
        <div className="auth-confirmacion__icono">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.5l7.5 5 7.5-5M2.5 5.5h15v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-10Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="auth-confirmacion__titulo">Revisa tu correo</h2>
        <p className="auth-confirmacion__descripcion">
          Enviamos las instrucciones de recuperación a{' '}
          <span className="auth-confirmacion__correo">{datos.correo}</span>.
          El enlace es válido por 30 minutos.
        </p>
        <Link
          href="/login"
          className="boton-primario"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="auth-encabezado">
        <span className="auth-marca-movil">LPC</span>
        <div className="auth-pasos" aria-label="Paso 1 de 2">
          <span className="auth-paso auth-paso--activo" />
          <span className="auth-paso" />
        </div>
        <h1 className="auth-titulo">Recupera tu acceso</h1>
        <p className="auth-subtitulo">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </header>

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

        <button
          type="submit"
          disabled={cargando}
          className={`boton-primario${cargando ? ' boton-primario--cargando' : ''}`}
        >
          {cargando ? '' : 'Enviar instrucciones'}
        </button>
      </form>

      <p className="auth-enlace-alternativo">
        <Link href="/login">← Volver a iniciar sesión</Link>
      </p>
    </>
  );
}