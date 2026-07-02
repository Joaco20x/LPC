const mockPrisma = {
  grupo: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";

const repo = new PrismaGrupoRepository();

const includeDetalle = {
  miembros: {
    include: { usuario: { select: { id: true, nombre: true, correo: true } } },
  },
  gastos: {
    orderBy: { creadoEn: "desc" },
    include: {
      pagador: { select: { id: true, nombre: true } },
      divisiones: {
        include: { usuario: { select: { id: true, nombre: true } } },
      },
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaGrupoRepository", () => {
  it("crear sin tx usa prisma", async () => {
    const data = {
      nombre: "Viaje",
      destino: "Chile",
      fechaInicio: new Date(),
      fechaFin: new Date(),
      monedaBase: "CLP",
    };
    mockPrisma.grupo.create.mockResolvedValue({ id: "g1" });
    const result = await repo.crear(data);
    expect(result.id).toBe("g1");
    expect(mockPrisma.grupo.create).toHaveBeenCalledWith({ data });
  });

  it("crear con tx usa el cliente de transaccion", async () => {
    const tx = { grupo: { create: jest.fn().mockResolvedValue({ id: "g1" }) } };
    const data = {
      nombre: "Viaje",
      destino: "Chile",
      fechaInicio: new Date(),
      fechaFin: new Date(),
      monedaBase: "CLP",
    };
    const result = await repo.crear(data, tx as any);
    expect(result.id).toBe("g1");
    expect(tx.grupo.create).toHaveBeenCalledWith({ data });
    expect(mockPrisma.grupo.create).not.toHaveBeenCalled();
  });

  it("obtenerDetalle retorna grupo con relaciones", async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue({ id: "g1", gastos: [] });
    const result = await repo.obtenerDetalle("g1");
    expect(result?.id).toBe("g1");
    expect(mockPrisma.grupo.findUnique).toHaveBeenCalledWith({
      where: { id: "g1" },
      include: includeDetalle,
    });
  });

  it("obtenerDetalle retorna null si no existe", async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null);
    const result = await repo.obtenerDetalle("no-existe");
    expect(result).toBeNull();
  });

  it("actualizarPresupuesto llama a prisma.grupo.update con presupuestoPorPersona y umbralAlerta", async () => {
    const datos = { presupuestoPorPersona: 50000, umbralAlerta: 80 };
    mockPrisma.grupo.update.mockResolvedValue({ id: "g1" } as any);
    await repo.actualizarPresupuesto("g1", datos);
    expect(mockPrisma.grupo.update).toHaveBeenCalledWith({
      where: { id: "g1" },
      data: { presupuestoPorPersona: 50000, umbralAlerta: 80 },
    });
  });

  it("obtenerTodosActivos retorna grupos con estado activo e incluye miembros", async () => {
    const mockGrupos = [
      { id: "g1", nombre: "Grupo 1", estado: "activo", miembros: [] },
      { id: "g2", nombre: "Grupo 2", estado: "activo", miembros: [] },
    ];
    mockPrisma.grupo.findMany.mockResolvedValue(mockGrupos);
    const result = await repo.obtenerTodosActivos();
    expect(result).toEqual(mockGrupos);
    expect(mockPrisma.grupo.findMany).toHaveBeenCalledWith({
      where: { estado: "activo" },
      include: { miembros: true },
    });
  });
});
