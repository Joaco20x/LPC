import { prisma } from '@/shared/libs/prisma';
import type { TokenRecuperacion } from '@prisma/client';
import type { ITokenRecuperacionRepository, DatosCrearTokenRecuperacion } from './ITokenRecuperacionRepository';

export class PrismaTokenRecuperacionRepository implements ITokenRecuperacionRepository {
  async invalidarPorIdUsuario(idUsuario: string): Promise<void> {
    await prisma.tokenRecuperacion.updateMany({
      where: { idUsuario, usado: false },
      data: { usado: true },
    });
  }
  async crear(data: DatosCrearTokenRecuperacion): Promise<TokenRecuperacion> {
    return prisma.tokenRecuperacion.create({ data });
  }
  async buscarTokenValido(token: string): Promise<TokenRecuperacion | null> {
    return prisma.tokenRecuperacion.findFirst({
      where: { token, usado: false, expiraEn: { gt: new Date() } },
    });
  }
  async marcarComoUsado(id: string): Promise<void> {
    await prisma.tokenRecuperacion.update({ where: { id }, data: { usado: true } });
  }
}
