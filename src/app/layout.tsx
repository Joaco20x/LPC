// Layout raíz — obligatorio en Next.js App Router
// Debe contener <html> y <body>

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LPC — Gestión de Gastos de Viaje",
  description:
    "Registra gastos, divide costos y liquida deudas con tu grupo de viaje.",
};

interface PropsLayout {
  children: React.ReactNode;
}

export default function LayoutRaiz({ children }: PropsLayout) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
