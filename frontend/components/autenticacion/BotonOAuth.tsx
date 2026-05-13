'use client';

// Componente para botones de OAuth - SRP + OCP (abierto a nuevos proveedores)

import type { ProveedorOAuth } from '@/shared/types/autenticacion';

interface PropsBotonOAuth {
  proveedor: ProveedorOAuth;
  onClick: () => void;
  cargando?: boolean;
}

const ETIQUETAS_PROVEEDOR: Record<ProveedorOAuth, string> = {
  google: 'Continuar con Google',
  apple: 'Continuar con Apple',
};

// Íconos SVG inline para no depender de librerías externas
const IconoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      fill="#EA4335"
    />
  </svg>
);

const IconoApple = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <path d="M13.18 9.385c-.021-2.14 1.745-3.174 1.824-3.226-1-1.456-2.547-1.655-3.094-1.674-1.314-.134-2.572.777-3.238.777-.666 0-1.69-.759-2.779-.738-1.43.022-2.75.835-3.484 2.117-1.492 2.582-.381 6.408 1.07 8.506.712 1.024 1.558 2.172 2.668 2.131 1.074-.044 1.478-.688 2.775-.688 1.298 0 1.664.688 2.795.664 1.155-.019 1.882-1.043 2.585-2.073.822-1.187 1.157-2.347 1.175-2.405-.026-.011-2.25-.863-2.273-3.392Z" />
    <path d="M11.048 3.176C11.623 2.475 12.01 1.504 11.9.521c-.848.036-1.88.567-2.48 1.251-.541.618-.998 1.615-.873 2.566.952.073 1.921-.479 2.501-1.162Z" />
  </svg>
);

const ICONOS_PROVEEDOR: Record<ProveedorOAuth, React.ReactNode> = {
  google: <IconoGoogle />,
  apple: <IconoApple />,
};

export default function BotonOAuth({ proveedor, onClick, cargando = false }: PropsBotonOAuth) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className="boton-oauth"
      aria-label={ETIQUETAS_PROVEEDOR[proveedor]}
    >
      <span className="boton-oauth__icono">{ICONOS_PROVEEDOR[proveedor]}</span>
      <span className="boton-oauth__texto">{ETIQUETAS_PROVEEDOR[proveedor]}</span>
    </button>
  );
}