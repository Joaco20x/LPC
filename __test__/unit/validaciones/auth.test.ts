import {
  validarCorreo,
  validarContrasena,
  validarNombre,
  validarInicioSesion,
  validarRegistro,
  validarRecuperacion,
} from '@/auth/validaciones/autenticacion';

describe('validarCorreo', () => {
  it('retorna null para un correo válido', () => {
    expect(validarCorreo('test@example.com')).toBeNull();
  });

  it('retorna error para correo vacío', () => {
    expect(validarCorreo('')).toBe('El correo es obligatorio');
  });

  it('retorna error para correo sin @', () => {
    expect(validarCorreo('invalido')).toBe('Ingresa un correo válido');
  });
});

describe('validarContrasena', () => {
  it('retorna null para contraseña de 8+ caracteres', () => {
    expect(validarContrasena('12345678')).toBeNull();
  });

  it('retorna error para contraseña vacía', () => {
    expect(validarContrasena('')).toBe('La contraseña es obligatoria');
  });

  it('retorna error si es menor a 8 caracteres', () => {
    const result = validarContrasena('1234567');
    expect(result).toMatch(/Mínimo 8/);
  });
});

describe('validarNombre', () => {
  it('retorna null para nombre válido', () => {
    expect(validarNombre('Juan')).toBeNull();
  });

  it('retorna error si está vacío', () => {
    expect(validarNombre('')).toBe('El nombre es obligatorio');
  });

  it('retorna error si es menor a 2 caracteres', () => {
    expect(validarNombre('A')).toBe('El nombre debe tener al menos 2 caracteres');
  });
});

describe('validarInicioSesion', () => {
  it('retorna array vacío para datos válidos', () => {
    const errores = validarInicioSesion({ correo: 'a@b.com', contrasena: '12345678' });
    expect(errores).toHaveLength(0);
  });

  it('retorna errores para campos vacíos', () => {
    const errores = validarInicioSesion({ correo: '', contrasena: '' });
    expect(errores.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validarRegistro', () => {
  it('retorna array vacío para datos válidos', () => {
    const errores = validarRegistro({
      nombre: 'Juan', correo: 'a@b.com', contrasena: '12345678', confirmarContrasena: '12345678',
    });
    expect(errores).toHaveLength(0);
  });

  it('retorna error si las contraseñas no coinciden', () => {
    const errores = validarRegistro({
      nombre: 'Juan', correo: 'a@b.com', contrasena: '12345678', confirmarContrasena: '87654321',
    });
    expect(errores).toContainEqual({ campo: 'confirmarContrasena', mensaje: 'Las contraseñas no coinciden' });
  });
});

describe('validarRecuperacion', () => {
  it('retorna array vacío para correo válido', () => {
    expect(validarRecuperacion({ correo: 'a@b.com' })).toHaveLength(0);
  });

  it('retorna error para correo vacío', () => {
    const errores = validarRecuperacion({ correo: '' });
    expect(errores.length).toBeGreaterThanOrEqual(1);
  });
});
