import { Opcion, DivisionFormulario } from '../../../frontend/components/esquemas/useGastoForm';

interface Props {
  divisiones: DivisionFormulario[];
  miembros: Opcion[];
  onAgregar: () => void;
  onEliminar: (i: number) => void;
  onChange: (i: number, campo: keyof DivisionFormulario, valor: string) => void;
  errorDivisiones?: string;
}

export function DivisionesSection({ divisiones, miembros, onAgregar, onEliminar, onChange, errorDivisiones }: Props) {
  return (
    <div className="divisiones-seccion">
      <div className="divisiones-header">
        <span className="divisiones-titulo">División del gasto</span>
        <span className="opcional">
          ({divisiones.length} persona{divisiones.length !== 1 ? 's' : ''})
        </span>
        <button type="button" className="btn-agregar-division" onClick={onAgregar}>
          + Agregar
        </button>
      </div>

      {divisiones.length === 0 && (
        <p className="divisiones-vacio">Sin divisiones asignadas aún.</p>
      )}

      {divisiones.map((div, i) => (
        <div key={i} className="division-fila">
          <select
            className="form-control"
            value={div.idUsuario}
            onChange={(e) => onChange(i, 'idUsuario', e.target.value)}
          >
            <option value="">Persona</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={div.tipoDivision}
            onChange={(e) => onChange(i, 'tipoDivision', e.target.value)}
          >
            <option value="igual">Igual</option>
            <option value="exacto">Monto exacto</option>
            <option value="porcentaje">Porcentaje</option>
          </select>

          <input
            type="number"
            className="form-control"
            placeholder={div.tipoDivision === 'porcentaje' ? '% (ej: 50)' : 'Monto'}
            value={div.montoAsignado}
            min="0"
            onChange={(e) => onChange(i, 'montoAsignado', e.target.value)}
          />

          <button
            type="button"
            className="btn-eliminar-division"
            onClick={() => onEliminar(i)}
            aria-label="Eliminar división"
          >
            ✕
          </button>
        </div>
      ))}

      {errorDivisiones && (
        <span className="error-msg" style={{ display: 'block', marginTop: '0.5rem' }}>
          {errorDivisiones}
        </span>
      )}
    </div>
  );
}
