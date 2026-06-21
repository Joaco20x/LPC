import { prisma } from "@/shared/libs/prisma";

export const PrismaDatabaseService = {
  async transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
