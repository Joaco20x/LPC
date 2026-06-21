import { hashearContrasena, verificarContrasena } from '@/auth/services/contraseña';

describe('hashearContrasena', () => {
  it('retorna un hash para una contraseña', async () => {
    const hash = await hashearContrasena('mi-contraseña');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
  });

  it('produce hashes distintos para la misma contraseña (salt)', async () => {
    const hash1 = await hashearContrasena('mi-contraseña');
    const hash2 = await hashearContrasena('mi-contraseña');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verificarContrasena', () => {
  it('retorna true para la contraseña correcta', async () => {
    const hash = await hashearContrasena('mi-contraseña');
    const valida = await verificarContrasena('mi-contraseña', hash);
    expect(valida).toBe(true);
  });

  it('retorna false para contraseña incorrecta', async () => {
    const hash = await hashearContrasena('mi-contraseña');
    const valida = await verificarContrasena('otra-contraseña', hash);
    expect(valida).toBe(false);
  });
});
