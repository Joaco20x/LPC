import { prisma } from "@/shared/libs/prisma";
import type { TransactionClient } from "@/shared/libs/IDatabaseService";
import type {
  IDivisionGastoRepository,
  DatosCrearDivision,
} from "./IDivisionGastoRepository";

export class PrismaDivisionGastoRepository implements IDivisionGastoRepository {
  async crearMuchas(
    data: DatosCrearDivision[],
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.divisionGasto.createMany({ data });
  }
}
