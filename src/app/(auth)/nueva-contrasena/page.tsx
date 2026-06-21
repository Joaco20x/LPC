'use client';

// Página nueva contraseña — FR-01
// Paso 2 del flujo de recuperación: /nueva-contrasena?token=...

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormulario } from '@/auth/validaciones/useFormulario';
import { validarContrasena } from '@/auth/validaciones/autenticacion';
import { cambiarContrasena } from '@/auth/validaciones/servicioAuth';
import CampoEntrada from '@/auth/components/CampoEntrada';

interface DatosNuevaContrasena {
  contrasena: string;
  confirmarContrasena: string;
}

const VALORES_INICIALES: DatosNuevaContrasena = {
  contrasena: '',
  confirmarContrasena: '',
};

function FormularioNuevaContrasena() {
  const params = useSearchParams();
  const token = params.get('token');

  const [estado, acciones] = useFormulario<DatosNuevaContrasena>(VALORES_INICIALES);
  const { datos, errores, cargando, enviado } = estado;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorContrasena = validarContrasena(datos.contrasena);
    if (errorContrasena) {
      acciones.establecerErrores([{ campo: 'contrasena', mensaje: errorContrasena }]);
      return;
    }

    if (datos.contrasena !== datos.confirmarContrasena) {
      acciones.establecerErrores([
        { campo: 'confirmarContrasena', mensaje: 'Las contraseñas no coinciden' },
      ]);
      return;
    }

    acciones.establecerCargando(true);

    try {
      // token! es seguro aquí porque el bloque de token ausente lo maneja abajo
      await cambiarContrasena(token!, datos.contrasena);
      acciones.establecerEnviado(true);
    } catch (error) {
      const mensaje = error instanceof Error
        ? error.message
        : 'Error al actualizar la contraseña';
      acciones.establecerErrores([{ campo: 'contrasena', mensaje }]);
    } finally {
      acciones.establecerCargando(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-confirmacion">
        <div
          className="auth-confirmacion__icono"
          style={{ backgroundColor: '#fdf0f0', color: '#8b3a3a' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 6v4m0 4h.01M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="auth-confirmacion__titulo">Enlace inválido</h2>
        <p className="auth-confirmacion__descripcion">
          Este enlace no es válido o ha expirado. Solicita uno nuevo.
        </p>
        <Link
          href="/recuperar-contrasena"
          className="boton-primario"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="auth-confirmacion">
        <div className="auth-confirmacion__icono">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 10l4.5 4.5L16 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="auth-confirmacion__titulo">Contraseña actualizada</h2>
        <p className="auth-confirmacion__descripcion">
          Tu contraseña fue cambiada correctamente. Ya puedes ingresar.
        </p>
        <Link
          href="/login"
          className="boton-primario"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="auth-encabezado">
        <span className="auth-marca-movil">LPC</span>
        <div className="auth-pasos" aria-label="Paso 2 de 2">
          <span className="auth-paso auth-paso--activo" />
          <span className="auth-paso auth-paso--activo" />
        </div>
        <h1 className="auth-titulo">Nueva contraseña</h1>
        <p className="auth-subtitulo">Elige una contraseña segura de al menos 8 caracteres.</p>
      </header>

      <form onSubmit={manejarEnvio} noValidate className="auth-formulario">
        <CampoEntrada
          id="contrasena"
          etiqueta="Nueva contraseña"
          tipo="password"
          valor={datos.contrasena}
          error={errores.contrasena}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          onChange={(valor) => acciones.actualizarCampo('contrasena', valor)}
        />
        <CampoEntrada
          id="confirmarContrasena"
          etiqueta="Confirmar contraseña"
          tipo="password"
          valor={datos.confirmarContrasena}
          error={errores.confirmarContrasena}
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          onChange={(valor) => acciones.actualizarCampo('confirmarContrasena', valor)}
        />
        <button
          type="submit"
          disabled={cargando}
          className={`boton-primario${cargando ? ' boton-primario--cargando' : ''}`}
        >
          {cargando ? '' : 'Guardar contraseña'}
        </button>
      </form>
    </>
  );
}

export default function PaginaNuevaContrasena() {
  return (
    <Suspense
      fallback={
        <div className="auth-encabezado">
          <p className="auth-subtitulo">Cargando...</p>
        </div>
      }
    >
      <FormularioNuevaContrasena />
    </Suspense>
  );
}