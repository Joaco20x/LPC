// lib/auth/jwt.ts
// Genera y verifica JSON Web Tokens
// accessToken: corta duración (15 min) — viaja en memoria del cliente
// refreshToken: larga duración (7 días) — viaja en cookie httpOnly

import jwt from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'Faltan variables de entorno JWT_ACCESS_SECRET y/o JWT_REFRESH_SECRET'
  );
}

export interface PayloadJWT {
  idUsuario: string;
  correo: string;
}

interface TokensGenerados {
  accessToken: string;
  refreshToken: string;
}

export function generarTokens(payload: PayloadJWT): TokensGenerados {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verificarAccessToken(token: string): PayloadJWT {
  return jwt.verify(token, ACCESS_SECRET) as PayloadJWT;
}

export function verificarRefreshToken(token: string): PayloadJWT {
  return jwt.verify(token, REFRESH_SECRET) as PayloadJWT;
}