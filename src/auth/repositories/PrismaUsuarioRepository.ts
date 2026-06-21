import { prisma } from '@/shared/libs/prisma';
import type { Usuario } from '@prisma/client';
import type { IUsuarioRepository, DatosCrearUsuario } from './IUsuarioRepository';

export class PrismaUsuarioRepository implements IUsuarioRepository {
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { correo } });
  }
  async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }
  async buscarPorOauth(proveedor: string, idProveedor: string): Promise<Usuario | null> {
    return prisma.usuario.findFirst({
      where: { proveedorOauth: proveedor, idProveedorOauth: idProveedor },
    });
  }
  async buscarPorEmails(emails: string[]): Promise<Pick<Usuario, 'id' | 'nombre' | 'correo'>[]> {
    return prisma.usuario.findMany({
      where: { correo: { in: emails } },
      select: { id: true, nombre: true, correo: true },
    });
  }
  async crear(data: DatosCrearUsuario): Promise<Usuario> {
    return prisma.usuario.create({ data });
  }
  async actualizarContrasena(id: string, hash: string): Promise<void> {
    await prisma.usuario.update({ where: { id }, data: { contrasenaHash: hash } });
  }
}
