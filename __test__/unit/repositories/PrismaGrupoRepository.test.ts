const mockPrisma = {
  grupo: {
    create: jest.fn(),
    findUnique: jest.fn(),
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
});
