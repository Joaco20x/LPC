import {
  validarMonto,
  validarDescripcion,
  validarCategoria,
  validarGrupo,
  validarGasto,
} from '@/gastos/validaciones/gasto';

describe('validarMonto', () => {
  it('retorna null para monto válido', () => {
    expect(validarMonto(100)).toBeNull();
  });

  it('retorna null para monto 0 (opcional)', () => {
    expect(validarMonto(0)).toBeNull();
  });

  it('retorna null para null/undefined', () => {
    expect(validarMonto(null)).toBeNull();
    expect(validarMonto(undefined)).toBeNull();
  });

  it('retorna error para monto negativo', () => {
    expect(validarMonto(-10)).toBe('El monto no puede ser negativo');
  });
});

describe('validarDescripcion', () => {
  it('retorna null para descripción válida', () => {
    expect(validarDescripcion('Cena en restaurante')).toBeNull();
  });

  it('retorna null para null/undefined', () => {
    expect(validarDescripcion(null)).toBeNull();
  });

  it('retorna error si es menor a 3 caracteres', () => {
    expect(validarDescripcion('ab')).toBe('La descripción debe tener al menos 3 caracteres');
  });

  it('retorna error si supera 255 caracteres', () => {
    expect(validarDescripcion('a'.repeat(256))).toBe('La descripción no puede superar los 255 caracteres');
  });
});

describe('validarCategoria', () => {
  it('retorna null para categoría válida', () => {
    expect(validarCategoria('Comida')).toBeNull();
    expect(validarCategoria('Transporte')).toBeNull();
    expect(validarCategoria('Alojamiento')).toBeNull();
    expect(validarCategoria('Entretenimiento')).toBeNull();
    expect(validarCategoria('Otros')).toBeNull();
  });

  it('retorna null para null/undefined', () => {
    expect(validarCategoria(null)).toBeNull();
  });

  it('retorna error para categoría inválida', () => {
    expect(validarCategoria('Invalida')).toBe('Categoría no válida');
  });
});

describe('validarGrupo', () => {
  it('retorna null para idGrupo válido', () => {
    expect(validarGrupo('uuid-123')).toBeNull();
  });

  it('retorna error si está vacío', () => {
    expect(validarGrupo('')).toBe('El gasto debe estar asociado a un grupo válido');
  });

  it('retorna error si es null/undefined', () => {
    expect(validarGrupo(null)).toBe('El gasto debe estar asociado a un grupo válido');
  });
});

describe('validarGasto', () => {
  it('retorna array vacío para datos mínimos válidos', () => {
    const errores = validarGasto({ idGrupo: 'grupo-1', monto: 0 });
    expect(errores).toHaveLength(0);
  });

  it('retorna error si falta idGrupo', () => {
    const errores = validarGasto({ monto: 100 });
    expect(errores.some((e) => e.campo === 'idGrupo')).toBe(true);
  });

  it('valida divisiones exactas que suman correctamente', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 100,
      divisiones: [
        { idUsuario: 'u1', montoAsignado: 60, tipoDivision: 'exacto' },
        { idUsuario: 'u2', montoAsignado: 40, tipoDivision: 'exacto' },
      ],
    });
    expect(errores).toHaveLength(0);
  });

  it('detecta suma incorrecta en divisiones exactas', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 100,
      divisiones: [
        { idUsuario: 'u1', montoAsignado: 30, tipoDivision: 'exacto' },
      ],
    });
    expect(errores.some((e) => e.campo === 'divisiones')).toBe(true);
  });

  it('valida que porcentajes sumen 100%', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 200,
      divisiones: [
        { idUsuario: 'u1', montoAsignado: 50, tipoDivision: 'porcentaje' },
        { idUsuario: 'u2', montoAsignado: 50, tipoDivision: 'porcentaje' },
      ],
    });
    expect(errores).toHaveLength(0);
  });

  it('detecta porcentajes que no suman 100%', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 200,
      divisiones: [
        { idUsuario: 'u1', montoAsignado: 30, tipoDivision: 'porcentaje' },
      ],
    });
    expect(errores.some((e) => e.campo === 'divisiones')).toBe(true);
  });

  it('detecta división sin idUsuario', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 100,
      divisiones: [
        { idUsuario: '', montoAsignado: 50, tipoDivision: 'exacto' },
      ],
    });
    expect(errores.some((e) => e.campo.includes('idUsuario'))).toBe(true);
  });

  it('detecta monto negativo en división', () => {
    const errores = validarGasto({
      idGrupo: 'g1', monto: 100,
      divisiones: [
        { idUsuario: 'u1', montoAsignado: -10, tipoDivision: 'exacto' },
      ],
    });
    expect(errores.some((e) => e.campo.includes('montoAsignado'))).toBe(true);
  });
});
