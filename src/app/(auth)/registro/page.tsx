'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormulario } from '@/auth/validaciones/useFormulario';
import { validarRegistro } from '@/auth/validaciones/autenticacion';
import { registrar } from '@/auth/validaciones/servicioAuth';
import CampoEntrada from '@/auth/components/CampoEntrada';
import BotonOAuth from '@/auth/components/BotonOAuth';
import Separador from '@/auth/components/Separador';
import type { DatosRegistro, ProveedorOAuth } from '@/auth/types/autenticacion';
import { guardarAccessToken, guardarDatosUsuario } from '@/shared/servicios/almacenamientoTokens';
const VALORES_INICIALES: DatosRegistro = {
  nombre: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};



export default function PaginaRegistro() {
  const router = useRouter();
  const [estado, acciones] = useFormulario<DatosRegistro>(VALORES_INICIALES);
  const { datos, errores, cargando, enviado } = estado;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const erroresValidacion = validarRegistro(datos);
    if (erroresValidacion.length > 0) {
      acciones.establecerErrores(erroresValidacion);
      return;
    }

    acciones.establecerCargando(true);

    try {
      const respuesta = await registrar(datos);

      if (respuesta.datos?.accessToken) {
        guardarAccessToken(respuesta.datos.accessToken);
      }
      if (respuesta.datos?.usuario) {
        guardarDatosUsuario(respuesta.datos.usuario);
      }

      acciones.establecerEnviado(true);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al crear la cuenta';
      acciones.establecerErrores([{ campo: 'correo', mensaje }]);
    } finally {
      acciones.establecerCargando(false);
    }
  };

  const manejarOAuth = (proveedor: ProveedorOAuth) => {
    if (proveedor === 'google') {
      window.location.href = '/api/auth/google/iniciar';
    }
  };

  if (enviado) {
    return (
      <div className="auth-confirmacion">
        <div className="auth-confirmacion__icono">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10l4.5 4.5L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="auth-confirmacion__titulo">Cuenta creada</h2>
        <p className="auth-confirmacion__descripcion">
          Enviamos un correo de verificación a{' '}
          <span className="auth-confirmacion__correo">{datos.correo}</span>.
          Revisa tu bandeja de entrada para activar tu cuenta.
        </p>
        <Link href="/login" className="boton-primario" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="auth-encabezado">
        <span className="auth-marca-movil">LPC</span>
        <h1 className="auth-titulo">Crea tu cuenta</h1>
        <p className="auth-subtitulo">Empieza a gestionar tus gastos de viaje</p>
      </header>

      <div className="auth-oauth-grupo">
        <BotonOAuth proveedor="google" onClick={() => manejarOAuth('google')} cargando={cargando} />
        <BotonOAuth proveedor="apple" onClick={() => manejarOAuth('apple')} cargando={cargando} />
      </div>

      <Separador texto="o regístrate con correo" />

      <form onSubmit={manejarEnvio} noValidate className="auth-formulario">
        <CampoEntrada id="nombre" etiqueta="Nombre completo" tipo="text" valor={datos.nombre} error={errores.nombre} placeholder="Tu nombre" autoComplete="name" onChange={(valor) => acciones.actualizarCampo('nombre', valor)} />
        <CampoEntrada id="correo" etiqueta="Correo electrónico" tipo="email" valor={datos.correo} error={errores.correo} placeholder="tu@correo.com" autoComplete="email" onChange={(valor) => acciones.actualizarCampo('correo', valor)} />
        <CampoEntrada id="contrasena" etiqueta="Contraseña" tipo="password" valor={datos.contrasena} error={errores.contrasena} placeholder="Mínimo 8 caracteres" autoComplete="new-password" onChange={(valor) => acciones.actualizarCampo('contrasena', valor)} />
        <CampoEntrada id="confirmarContrasena" etiqueta="Confirmar contraseña" tipo="password" valor={datos.confirmarContrasena} error={errores.confirmarContrasena} placeholder="Repite tu contraseña" autoComplete="new-password" onChange={(valor) => acciones.actualizarCampo('confirmarContrasena', valor)} />

        <button type="submit" disabled={cargando} className={`boton-primario${cargando ? ' boton-primario--cargando' : ''}`}>
          {cargando ? '' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-enlace-alternativo">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login">Ingresar</Link>
      </p>
    </>
  );
}