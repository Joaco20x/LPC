import { prisma } from '@/backend/db/prisma';
import type { IDivisionGastoRepository, DatosCrearDivision } from '@/shared/repositories/IDivisionGastoRepository';

export class PrismaDivisionGastoRepository implements IDivisionGastoRepository {
  async crearMuchas(data: DatosCrearDivision[], tx?: unknown): Promise<void> {
    const client = tx as any || prisma;
    await client.divisionGasto.createMany({ data });
  }
}
