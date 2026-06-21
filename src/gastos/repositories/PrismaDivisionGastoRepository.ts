import { prisma } from '@/shared/libs/prisma';
import type { IDivisionGastoRepository, DatosCrearDivision } from './IDivisionGastoRepository';

export class PrismaDivisionGastoRepository implements IDivisionGastoRepository {
  async crearMuchas(data: DatosCrearDivision[], tx?: unknown): Promise<void> {
    const client = tx as any || prisma;
    await client.divisionGasto.createMany({ data });
  }
}
