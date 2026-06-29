const mockPrisma = {
  deuda: {
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaDeudaRepository } from "@/deudas/repositories/PrismaDeudaRepository";

const repo = new PrismaDeudaRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaDeudaRepository", () => {
  it("crearMuchas sin tx usa prisma directamente", async () => {
    const data = [
      {
        idGrupo: "g1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 100,
        saldada: false,
      },
    ];
    await repo.crearMuchas(data);
    expect(mockPrisma.deuda.createMany).toHaveBeenCalledWith({ data });
  });

  it("crearMuchas con tx usa el cliente de transaccion", async () => {
    const tx = { deuda: { createMany: jest.fn() } };
    const data = [
      {
        idGrupo: "g1",
        idDeudor: "u1",
        idAcreedor: "u2",
        monto: 100,
        saldada: false,
      },
    ];
    await repo.crearMuchas(data, tx as any);
    expect(tx.deuda.createMany).toHaveBeenCalledWith({ data });
    expect(mockPrisma.deuda.createMany).not.toHaveBeenCalled();
  });

  it("obtenerPendientes retorna deudas del usuario", async () => {
    const deuda = { id: "d1", idDeudor: "u1", idAcreedor: "u2", monto: 100 };
    mockPrisma.deuda.findMany.mockResolvedValue([deuda]);
    const result = await repo.obtenerPendientes("u1");
    expect(result).toHaveLength(1);
    expect(mockPrisma.deuda.findMany).toHaveBeenCalledWith({
      where: {
        saldada: false,
        OR: [{ idDeudor: "u1" }, { idAcreedor: "u1" }],
      },
      include: expect.any(Object),
    });
  });

  it("obtenerPendientes filtra por grupo si se proporciona", async () => {
    mockPrisma.deuda.findMany.mockResolvedValue([]);
    await repo.obtenerPendientes("u1", "g1");
    expect(mockPrisma.deuda.findMany).toHaveBeenCalledWith({
      where: {
        saldada: false,
        idGrupo: "g1",
        OR: [{ idDeudor: "u1" }, { idAcreedor: "u1" }],
      },
      include: expect.any(Object),
    });
  });

  it("obtenerTodasPorGrupo retorna deudas del grupo", async () => {
    mockPrisma.deuda.findMany.mockResolvedValue([]);
    await repo.obtenerTodasPorGrupo("g1");
    expect(mockPrisma.deuda.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1", saldada: false },
      include: expect.any(Object),
    });
  });
});
