"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormulario } from "@/auth/validaciones/useFormulario";
import { validarInicioSesion } from "@/auth/validaciones/autenticacion";
import { iniciarSesion } from "@/auth/validaciones/servicioAuth";
import CampoEntrada from "@/auth/components/CampoEntrada";
import BotonOAuth from "@/auth/components/BotonOAuth";
import Separador from "@/auth/components/Separador";
import type {
  DatosInicioSesion,
  ProveedorOAuth,
} from "@/auth/types/autenticacion";
import {
  guardarAccessToken,
  guardarDatosUsuario,
} from "@/shared/servicios/almacenamientoTokens";
import "@/app/(auth)/auth.css";

const VALORES_INICIALES: DatosInicioSesion = { correo: "", contrasena: "" };

export default function PaginaInicioSesion() {
  return (
    <Suspense fallback={<div className="auth-cargando">Cargando...</div>}>
      <InicioSesionForm />
    </Suspense>
  );
}

function InicioSesionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, acciones] =
    useFormulario<DatosInicioSesion>(VALORES_INICIALES);
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
      const respuesta = await iniciarSesion(datos);

      if (respuesta.datos?.accessToken) {
        guardarAccessToken(respuesta.datos.accessToken);
      }
      if (respuesta.datos?.usuario) {
        guardarDatosUsuario(respuesta.datos.usuario);
      }

      const redirect = searchParams.get("redirect");
      router.push(redirect || "/dashboard");
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al iniciar sesión";
      acciones.establecerErrores([{ campo: "contrasena", mensaje }]);
    } finally {
      acciones.establecerCargando(false);
    }
  };

  const manejarOAuth = (proveedor: ProveedorOAuth) => {
    if (proveedor === "google") {
      window.location.href = "/api/auth/google/iniciar";
    }
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
          onClick={() => manejarOAuth("google")}
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
          onChange={(valor) => acciones.actualizarCampo("correo", valor)}
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
            onChange={(valor) => acciones.actualizarCampo("contrasena", valor)}
          />
          <Link href="/recuperar-contrasena" className="auth-link-contrasena">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className={`boton-primario${cargando ? " boton-primario--cargando" : ""}`}
        >
          {cargando ? "" : "Ingresar"}
        </button>
      </form>

      <p className="auth-enlace-alternativo">
        ¿No tienes cuenta? <Link href="/registro">Crear cuenta</Link>
      </p>
    </>
  );
}
