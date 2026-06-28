const mockPrisma = {
  divisionGasto: { createMany: jest.fn() },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaDivisionGastoRepository } from "@/gastos/repositories/PrismaDivisionGastoRepository";

const repo = new PrismaDivisionGastoRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaDivisionGastoRepository", () => {
  it("crearMuchas sin tx usa prisma", async () => {
    const data = [{ idGasto: "g1", idUsuario: "u1", montoAsignado: 100, tipoDivision: "exacto", moneda: "CLP" }];
    await repo.crearMuchas(data);
    expect(mockPrisma.divisionGasto.createMany).toHaveBeenCalledWith({ data });
  });

  it("crearMuchas con tx usa el cliente de transaccion", async () => {
    const tx = { divisionGasto: { createMany: jest.fn() } };
    const data = [{ idGasto: "g1", idUsuario: "u1", montoAsignado: 100, tipoDivision: "exacto", moneda: "CLP" }];
    await repo.crearMuchas(data, tx as any);
    expect(tx.divisionGasto.createMany).toHaveBeenCalledWith({ data });
    expect(mockPrisma.divisionGasto.createMany).not.toHaveBeenCalled();
  });
});
