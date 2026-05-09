
// Encapsula bcryptjs para hashear y verificar contraseñas
// SRP: única responsabilidad — operaciones sobre contraseñas

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashearContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, SALT_ROUNDS);
}

export async function verificarContrasena(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}