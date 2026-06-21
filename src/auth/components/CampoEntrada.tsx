"use client";

// Componente atómico de entrada - SRP: solo renderiza un campo de formulario

interface PropsCampoEntrada {
  id: string;
  etiqueta: string;
  tipo?: "text" | "email" | "password" | "date";
  valor: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (valor: string) => void;
}

export default function CampoEntrada({
  id,
  etiqueta,
  tipo = "text",
  valor,
  error,
  placeholder,
  autoComplete,
  onChange,
}: PropsCampoEntrada) {
  return (
    <div className="campo-entrada-contenedor">
      <label htmlFor={id} className="campo-etiqueta">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={`campo-input${error ? " campo-input--error" : ""}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <span id={`${id}-error`} className="campo-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
