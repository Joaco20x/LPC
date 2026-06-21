// Layout para todas las rutas de autenticación
// Aplica la estructura visual y estilos compartidos del módulo

import type { Metadata } from "next";
import Link from "next/link";
import "@/app/(auth)/auth.css";

export const metadata: Metadata = {
  title: "LPC — Acceso",
  description: "Ingresa o crea tu cuenta en LPC",
};

interface PropsLayout {
  children: React.ReactNode;
}

export default function LayoutAutenticacion({ children }: PropsLayout) {
  return (
    <div className="auth-raiz">
      {/* Panel izquierdo: espacio reservado para imagen/ilustración */}
      <aside className="auth-panel-visual" aria-hidden="false">
        <div className="auth-panel-visual__imagen-placeholder">
          {/* 
            ESPACIO PARA IMAGEN
            Dimensiones sugeridas: 900x1200px
            Reemplaza este div con un <Image> de Next.js:
            
            <Image
              src="/tu-imagen.jpg"
              alt="Viaja sin preocupaciones"
              fill
              className="object-cover"
              priority
            />
          */}
        </div>
        <div className="auth-panel-visual__overlay">
          <div className="auth-panel-visual__marca">
            <Link href="/" className="auth-panel-visual__logo">
              LPC
            </Link>
            <p className="auth-panel-visual__eslogan">
              Viaja juntos.
              <br />
              Divide fácil.
            </p>
          </div>
        </div>
      </aside>

      {/* Panel derecho: formulario */}
      <main className="auth-panel-formulario">
        <div className="auth-panel-formulario__contenido">{children}</div>
      </main>
    </div>
  );
}
