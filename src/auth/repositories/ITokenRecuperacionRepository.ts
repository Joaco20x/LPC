import type { TokenRecuperacion } from "@prisma/client";

export interface DatosCrearTokenRecuperacion {
  idUsuario: string;
  token: string;
  expiraEn: Date;
}

export interface ITokenRecuperacionRepository {
  invalidarPorIdUsuario(idUsuario: string): Promise<void>;
  crear(data: DatosCrearTokenRecuperacion): Promise<TokenRecuperacion>;
  buscarTokenValido(token: string): Promise<TokenRecuperacion | null>;
  marcarComoUsado(id: string): Promise<void>;
}
