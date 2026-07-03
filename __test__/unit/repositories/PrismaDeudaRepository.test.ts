const mockPrisma = {
  deuda: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
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

  it("marcarComoSaldadas actualiza deudas pendientes entre deudor y acreedor", async () => {
    await repo.marcarComoSaldadas("g1", "u1", "u2");
    expect(mockPrisma.deuda.updateMany).toHaveBeenCalledWith({
      where: {
        idGrupo: "g1",
        idDeudor: "u1",
        idAcreedor: "u2",
        saldada: false,
      },
      data: { saldada: true },
    });
  });

  it("marcarComoSaldadas con tx usa el cliente de transaccion", async () => {
    const tx = { deuda: { updateMany: jest.fn() } };
    await repo.marcarComoSaldadas("g1", "u1", "u2", tx as any);
    expect(tx.deuda.updateMany).toHaveBeenCalled();
    expect(mockPrisma.deuda.updateMany).not.toHaveBeenCalled();
  });

  it("obtenerPorId retorna deuda si existe", async () => {
    const deuda = {
      id: "d1",
      idDeudor: "u1",
      idAcreedor: "u2",
      monto: 100,
      saldada: false,
      grupo: { id: "g1", nombre: "G1" },
      deudor: { id: "u1", nombre: "U1", correo: "u1@t.com" },
      acreedor: { id: "u2", nombre: "U2", correo: "u2@t.com" },
    };
    mockPrisma.deuda.findUnique.mockResolvedValue(deuda);
    const result = await repo.obtenerPorId("d1");
    expect(result?.id).toBe("d1");
    expect(mockPrisma.deuda.findUnique).toHaveBeenCalledWith({
      where: { id: "d1" },
      include: expect.any(Object),
    });
  });

  it("obtenerPorId retorna null si no existe", async () => {
    mockPrisma.deuda.findUnique.mockResolvedValue(null);
    const result = await repo.obtenerPorId("no-existe");
    expect(result).toBeNull();
  });

  it("actualizarEstado solo estado sin pagadaEn", async () => {
    await repo.actualizarEstado("d1", "pagada");
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { estado: "pagada", saldada: true },
    });
  });

  it("actualizarEstado con estado y pagadaEn", async () => {
    const ahora = new Date();
    await repo.actualizarEstado("d1", "pagada", ahora);
    expect(mockPrisma.deuda.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { estado: "pagada", pagadaEn: ahora, saldada: true },
    });
  });
});
