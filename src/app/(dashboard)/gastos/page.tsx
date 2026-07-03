"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useGastoForm } from "@/gastos/components/useGastoForm";
import SubirBoleta from "@/gastos/components/SubirBoleta";
import { MONEDAS } from "@/gastos/types/gasto";
import { DivisionesSection } from "./DivisionesSection";
import "./gastos.css";

const CATEGORIAS = [
  "Comida",
  "Transporte",
  "Alojamiento",
  "Entretenimiento",
  "Otros",
];

function FormularioGasto() {
  const {
    grupos,
    miembros,
    cargando,
    errorGlobal,
    mensajeExito,
    formulario,
    errores,
    guardando,
    handleChange,
    handleSubmit,
    agregarDivision,
    eliminarDivision,
    handleDivisionChange,
  } = useGastoForm();

  const [conversion, setConversion] = useState<{
    montoConvertido: string;
    fuente: "api" | "cache" | null;
  } | null>(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const obtenerConversion = useCallback(async () => {
    const monto = Number(formulario.monto);
    if (
      !monto ||
      monto <= 0 ||
      !formulario.moneda ||
      !formulario.monedaDestino ||
      formulario.moneda === formulario.monedaDestino
    ) {
      setConversion(null);
      return;
    }

    setConvirtiendo(true);
    try {
      const res = await fetch(
        `/api/tasas-cambio?from=${formulario.moneda}&to=${formulario.monedaDestino}`,
      );
      const data = await res.json();
      if (data.exito) {
        const convertido = monto * data.datos.tasa;
        const locale = formulario.monedaDestino === "CLP" ? "es-CL" : "en-US";
        setConversion({
          montoConvertido: convertido.toLocaleString(locale, {
            style: "currency",
            currency: formulario.monedaDestino,
          }),
          fuente: data.datos.fuente,
        });
      }
    } catch {
      setConversion(null);
    } finally {
      setConvirtiendo(false);
    }
  }, [formulario.monto, formulario.moneda, formulario.monedaDestino]);

  useEffect(() => {
    const timer = setTimeout(obtenerConversion, 400);
    return () => clearTimeout(timer);
  }, [obtenerConversion]);

  return (
    <div className="gastos-container">
      <header className="gastos-header">
        <h1>Registrar Gasto</h1>
      </header>

      {errorGlobal && <div className="alerta alerta-error">{errorGlobal}</div>}
      {mensajeExito && (
        <div className="alerta alerta-exito">{mensajeExito}</div>
      )}

      {cargando ? (
        <p className="cargando">Cargando...</p>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit} noValidate>
            {/* Grupo */}
            {grupos.length > 0 && (
              <div className="form-group">
                <label htmlFor="idGrupo">Grupo de viaje</label>
                <select
                  id="idGrupo"
                  name="idGrupo"
                  className="form-control"
                  value={formulario.idGrupo}
                  onChange={handleChange}
                >
                  <option value="">Selecciona un grupo</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
                {errores.idGrupo && (
                  <span className="error-msg">{errores.idGrupo}</span>
                )}
              </div>
            )}

            {/* Descripción */}
            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <input
                id="descripcion"
                type="text"
                name="descripcion"
                className="form-control"
                placeholder="Ej: Cena en restaurante"
                value={formulario.descripcion}
                onChange={handleChange}
              />
              {errores.descripcion && (
                <span className="error-msg">{errores.descripcion}</span>
              )}
            </div>

            {/* Monto y Moneda */}
            <div className="form-group">
              <label htmlFor="monto">Monto</label>
              <div className="monto-con-moneda">
                <input
                  id="monto"
                  type="number"
                  name="monto"
                  className="form-control"
                  placeholder="Ej: 15000"
                  min="0"
                  value={formulario.monto}
                  onChange={handleChange}
                />
                <select
                  name="moneda"
                  className="form-control selector-moneda"
                  value={formulario.moneda}
                  onChange={handleChange}
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {errores.monto && (
                <span className="error-msg">{errores.monto}</span>
              )}
            </div>

            {/* Conversión de moneda */}
            <div className="form-group conversion-group">
              <label>Convertir a</label>
              <div className="conversion-selector">
                <span className="conversion-monto-origen">
                  {formulario.monto || "0"} {formulario.moneda}
                </span>
                <span className="conversion-flecha">→</span>
                <select
                  name="monedaDestino"
                  className="form-control selector-moneda"
                  value={formulario.monedaDestino}
                  onChange={handleChange}
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              {conversion && (
                <span className="conversion-resultado">
                  ≈ {conversion.montoConvertido}
                  {conversion.fuente === "cache" && (
                    <span
                      className="conversion-cache"
                      title="Tasa cachead a (sin conexión)"
                    >
                      {" "}
                      ◉ offline
                    </span>
                  )}
                </span>
              )}
              {convirtiendo && (
                <span className="conversion-resultado conversion-cargando">
                  Convirtiendo...
                </span>
              )}
              {formulario.moneda === formulario.monedaDestino &&
                Number(formulario.monto) > 0 && (
                  <span className="conversion-resultado conversion-igual">
                    Misma moneda — no se requiere conversión
                  </span>
                )}
            </div>

            {/* Categoría */}
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                name="categoria"
                className="form-control"
                value={formulario.categoria}
                onChange={handleChange}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errores.categoria && (
                <span className="error-msg">{errores.categoria}</span>
              )}
            </div>

            {/* Boleta */}
            <div className="form-group">
              <label htmlFor="urlBoleta">
                Boleta <span className="opcional">(opcional)</span>
              </label>
              <SubirBoleta
                onUrlCambio={(url) =>
                  handleChange({
                    target: { name: "urlBoleta", value: url ?? "" },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onDatosOCR={(monto, _fecha, descripcion) => {
                  if (monto !== null) {
                    handleChange({
                      target: { name: "monto", value: String(monto) },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                  if (descripcion !== null) {
                    handleChange({
                      target: { name: "descripcion", value: descripcion },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
                urlActual={formulario.urlBoleta || undefined}
              />
            </div>

            {/* Divisiones */}
            <DivisionesSection
              divisiones={formulario.divisiones}
              miembros={miembros}
              onAgregar={agregarDivision}
              onEliminar={eliminarDivision}
              onChange={handleDivisionChange}
              errorDivisiones={errores["divisiones"]}
            />

            {/* Acciones */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar Gasto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function PaginaRegistroGasto() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "4rem",
            textAlign: "center",
            color: "var(--color-texto-suave)",
          }}
        >
          Cargando...
        </div>
      }
    >
      <FormularioGasto />
    </Suspense>
  );
}
