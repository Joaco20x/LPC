import { prisma } from '@/shared/libs/prisma';

export const PrismaDatabaseService = {
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
