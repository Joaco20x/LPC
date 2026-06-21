'use client';

// Componente atómico separador - SRP

interface PropsSeparador {
  texto?: string;
}

export default function Separador({ texto = 'o' }: PropsSeparador) {
  return (
    <div className="separador" role="separator" aria-label={texto}>
      <span className="separador__linea" />
      <span className="separador__texto">{texto}</span>
      <span className="separador__linea" />
    </div>
  );
}
