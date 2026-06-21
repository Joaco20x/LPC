import type { Usuario } from '@prisma/client';

export interface DatosCrearUsuario {
  nombre: string;
  correo: string;
  contrasenaHash?: string | null;
  proveedorOauth?: string | null;
  idProveedorOauth?: string | null;
  verificado?: boolean;
}

export interface IUsuarioRepository {
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmails(emails: string[]): Promise<Pick<Usuario, 'id' | 'nombre' | 'correo'>[]>;
  buscarPorOauth(proveedor: string, idProveedor: string): Promise<Usuario | null>;
  crear(data: DatosCrearUsuario): Promise<Usuario>;
  actualizarContrasena(id: string, hash: string): Promise<void>;
}
