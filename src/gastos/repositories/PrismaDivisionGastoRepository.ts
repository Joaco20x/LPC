import { prisma } from "@/shared/libs/prisma";
import type { Prisma } from "@prisma/client";
import type {
  IDivisionGastoRepository,
  DatosCrearDivision,
} from "./IDivisionGastoRepository";

export class PrismaDivisionGastoRepository implements IDivisionGastoRepository {
  async crearMuchas(data: DatosCrearDivision[], tx?: unknown): Promise<void> {
    const client = (tx || prisma) as Prisma.TransactionClient;
    await client.divisionGasto.createMany({ data });
  }
}
