import { prisma } from "@/shared/libs/prisma";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";

export const PrismaDatabaseService = {
  async transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
