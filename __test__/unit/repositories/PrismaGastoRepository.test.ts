const mockPrisma = {
  gasto: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaGastoRepository } from "@/gastos/repositories/PrismaGastoRepository";

const repo = new PrismaGastoRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaGastoRepository", () => {
  const include = {
    pagador: { select: { id: true, nombre: true } },
    grupo: { select: { id: true, nombre: true } },
    divisiones: {
      include: { usuario: { select: { id: true, nombre: true } } },
    },
  };

  it("crear sin tx usa prisma", async () => {
    const data = {
      idGrupo: "g1",
      idPagador: "u1",
      monto: 100,
      moneda: "CLP",
      descripcion: "Test",
      categoria: "Comida",
      urlBoleta: null,
    };
    mockPrisma.gasto.create.mockResolvedValue({ id: "gasto-1", ...data });
    const result = await repo.crear(data);
    expect(result.id).toBe("gasto-1");
    expect(mockPrisma.gasto.create).toHaveBeenCalledWith({ data });
  });

  it("crear con tx usa el cliente de transaccion", async () => {
    const tx = {
      gasto: { create: jest.fn().mockResolvedValue({ id: "gasto-1" }) },
    };
    const data = {
      idGrupo: "g1",
      idPagador: "u1",
      monto: 100,
      moneda: "CLP",
      descripcion: "Test",
      categoria: "Comida",
      urlBoleta: null,
    };
    const result = await repo.crear(data, tx as any);
    expect(result.id).toBe("gasto-1");
    expect(tx.gasto.create).toHaveBeenCalledWith({ data });
    expect(mockPrisma.gasto.create).not.toHaveBeenCalled();
  });

  it("obtenerTodos retorna gastos ordenados", async () => {
    mockPrisma.gasto.findMany.mockResolvedValue([{ id: "g1" }]);
    const result = await repo.obtenerTodos();
    expect(result).toHaveLength(1);
    expect(mockPrisma.gasto.findMany).toHaveBeenCalledWith({
      orderBy: { creadoEn: "desc" },
      include,
    });
  });

  it("obtenerPorId retorna gasto por id", async () => {
    mockPrisma.gasto.findUnique.mockResolvedValue({ id: "g1" });
    const result = await repo.obtenerPorId("g1");
    expect(result?.id).toBe("g1");
    expect(mockPrisma.gasto.findUnique).toHaveBeenCalledWith({
      where: { id: "g1" },
      include,
    });
  });

  it("obtenerPorId retorna null si no existe", async () => {
    mockPrisma.gasto.findUnique.mockResolvedValue(null);
    const result = await repo.obtenerPorId("no-existe");
    expect(result).toBeNull();
  });

  it("obtenerPorGrupoYRangoFecha filtra por idGrupo y rango de fechas", async () => {
    const inicio = new Date("2026-01-01");
    const fin = new Date("2026-12-31");
    mockPrisma.gasto.findMany.mockResolvedValue([{ id: "g1" }]);
    const result = await repo.obtenerPorGrupoYRangoFecha("g1", inicio, fin);
    expect(result).toHaveLength(1);
    expect(mockPrisma.gasto.findMany).toHaveBeenCalledWith({
      where: {
        idGrupo: "g1",
        creadoEn: { gte: inicio, lte: fin },
      },
      orderBy: { creadoEn: "desc" },
      include,
    });
  });

  it("obtenerPorGrupo filtra por idGrupo", async () => {
    mockPrisma.gasto.findMany.mockResolvedValue([{ id: "g1" }]);
    const result = await repo.obtenerPorGrupo("g1");
    expect(result).toHaveLength(1);
    expect(mockPrisma.gasto.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1" },
      orderBy: { creadoEn: "desc" },
      include,
    });
  });
});
