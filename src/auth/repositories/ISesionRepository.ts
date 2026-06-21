import type { Sesion } from '@prisma/client';

export interface DatosCrearSesion {
  idUsuario: string;
  tokenHash: string;
  expiraEn: Date;
}

export interface ISesionRepository {
  crear(data: DatosCrearSesion): Promise<Sesion>;
  buscarPorTokenHash(tokenHash: string): Promise<Sesion | null>;
  actualizarTokenHash(id: string, nuevoHash: string): Promise<void>;
  eliminarPorTokenHash(tokenHash: string): Promise<void>;
  eliminarPorIdUsuario(idUsuario: string): Promise<void>;
}
