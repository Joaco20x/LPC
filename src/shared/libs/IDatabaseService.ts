import type { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export interface IDatabaseService {
  transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
}
