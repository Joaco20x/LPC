'use client';

import { Suspense } from 'react';
import { useGastoForm } from '../../../frontend/components/esquemas/useGastoForm';
import { DivisionesSection } from './DivisionesSection';
import './gastos.css';

const CATEGORIAS = ['Comida', 'Transporte', 'Alojamiento', 'Entretenimiento', 'Otros'];

function FormularioGasto() {
  const {
    grupos, miembros, cargando,
    errorGlobal, mensajeExito,
    formulario, errores, guardando,
    handleChange, handleSubmit,
    agregarDivision, eliminarDivision, handleDivisionChange,
  } = useGastoForm();

  return (
    <div className="gastos-container">
      <header className="gastos-header">
        <h1>Registrar Gasto</h1>
      </header>

      {errorGlobal   && <div className="alerta alerta-error">{errorGlobal}</div>}
      {mensajeExito  && <div className="alerta alerta-exito">{mensajeExito}</div>}

      {cargando ? (
        <p className="cargando">Cargando...</p>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit} noValidate>

            {/* Grupo */}
            {grupos.length > 0 && (
              <div className="form-group">
                <label htmlFor="idGrupo">Grupo de viaje</label>
                <select id="idGrupo" name="idGrupo" className="form-control"
                  value={formulario.idGrupo} onChange={handleChange}>
                  <option value="">Selecciona un grupo</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
                {errores.idGrupo && <span className="error-msg">{errores.idGrupo}</span>}
              </div>
            )}

            {/* Descripción */}
            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <input
                id="descripcion" type="text" name="descripcion"
                className="form-control" placeholder="Ej: Cena en restaurante"
                value={formulario.descripcion} onChange={handleChange}
              />
              {errores.descripcion && <span className="error-msg">{errores.descripcion}</span>}
            </div>

            {/* Monto */}
            <div className="form-group">
              <label htmlFor="monto">Monto (CLP)</label>
              <input
                id="monto" type="number" name="monto"
                className="form-control" placeholder="Ej: 15000" min="0"
                value={formulario.monto} onChange={handleChange}
              />
              {errores.monto && <span className="error-msg">{errores.monto}</span>}
            </div>

            {/* Categoría */}
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" name="categoria" className="form-control"
                value={formulario.categoria} onChange={handleChange}>
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errores.categoria && <span className="error-msg">{errores.categoria}</span>}
            </div>

            {/* Boleta */}
            <div className="form-group">
              <label htmlFor="urlBoleta">
                Enlace de boleta <span className="opcional">(opcional)</span>
              </label>
              <input
                id="urlBoleta" type="url" name="urlBoleta"
                className="form-control" placeholder="https://ejemplo.com/boleta.pdf"
                value={formulario.urlBoleta} onChange={handleChange}
              />
            </div>

            {/* Divisiones */}
            <DivisionesSection
              divisiones={formulario.divisiones}
              miembros={miembros}
              onAgregar={agregarDivision}
              onEliminar={eliminarDivision}
              onChange={handleDivisionChange}
              errorDivisiones={errores['divisiones']}
            />

            {/* Acciones */}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Gasto'}
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
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-texto-suave)' }}>Cargando...</div>}>
      <FormularioGasto />
    </Suspense>
  );
}
