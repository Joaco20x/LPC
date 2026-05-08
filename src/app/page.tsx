// Página principal — Landing de LPC
// Punto de entrada a todas las funciones de autenticación

import Link from 'next/link';
import './landing.css';

export default function PaginaInicio() {
  return (
    <main className="landing-raiz">

      {/* ── Navegación superior ── */}
      <nav className="landing-nav">
        <span className="landing-nav__marca">LPC</span>
        <div className="landing-nav__acciones">
          <Link href="/login" className="landing-nav__link">
            Ingresar
          </Link>
          <Link href="/registro" className="landing-nav__cta">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero__contenido">
          <p className="landing-hero__etiqueta">Gestión de gastos de viaje</p>
          <h1 className="landing-hero__titulo">
            Viaja juntos.<br />
            <em>Divide fácil.</em>
          </h1>
          <p className="landing-hero__descripcion">
            Registra gastos, divide costos y liquida deudas con tu grupo
            sin hojas de cálculo ni discusiones.
          </p>
          <div className="landing-hero__botones">
            <Link href="/registro" className="boton-solido">
              Comenzar gratis
            </Link>
            <Link href="/login" className="boton-fantasma">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Espacio para imagen hero */}
        <div className="landing-hero__imagen" aria-hidden="true">
          {/*
            ESPACIO PARA IMAGEN HERO
            Dimensiones sugeridas: 1200x900px, formato landscape
            Reemplaza con:

            <Image
              src="/hero.jpg"
              alt="Grupo de viajeros"
              fill
              className="object-cover"
              priority
            />
          */}
          <div className="landing-hero__imagen-placeholder" />
        </div>
      </section>

      {/* ── Características ── */}
      <section className="landing-features">
        <div className="landing-features__grid">

          <article className="landing-feature">
            <span className="landing-feature__numero">01</span>
            <h2 className="landing-feature__titulo">Registra</h2>
            <p className="landing-feature__texto">
              Agrega gastos en segundos con monto, categoría y foto de boleta.
              Sin formularios interminables.
            </p>
          </article>

          <article className="landing-feature">
            <span className="landing-feature__numero">02</span>
            <h2 className="landing-feature__titulo">Divide</h2>
            <p className="landing-feature__texto">
              Reparte de forma equitativa, porcentual o manual.
              Excluye integrantes cuando corresponda.
            </p>
          </article>

          <article className="landing-feature">
            <span className="landing-feature__numero">03</span>
            <h2 className="landing-feature__titulo">Liquida</h2>
            <p className="landing-feature__texto">
              Ve exactamente quién le debe a quién y cuánto.
              Sin cálculos, sin confusión.
            </p>
          </article>

        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="landing-cta">
        <div className="landing-cta__contenido">
          {/*
            ESPACIO PARA IMAGEN SECUNDARIA
            Dimensiones sugeridas: 600x400px
            <Image src="/viaje.jpg" alt="Viajeros" width={600} height={400} />
          */}
          <p className="landing-cta__texto">
            Tu próximo viaje,<br />sin las cuentas pendientes.
          </p>
          <Link href="/registro" className="boton-solido">
            Empezar ahora
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="landing-footer__marca">LPC</span>
        <div className="landing-footer__links">
          <Link href="/login">Ingresar</Link>
          <Link href="/registro">Registro</Link>
          <Link href="/recuperar-contrasena">Recuperar contraseña</Link>
        </div>
      </footer>

    </main>
  );
}
