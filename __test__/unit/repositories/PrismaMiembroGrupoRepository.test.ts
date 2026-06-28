const mockPrisma = {
  miembroGrupo: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaMiembroGrupoRepository } from "@/grupos/repositories/PrismaMiembroGrupoRepository";

const repo = new PrismaMiembroGrupoRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaMiembroGrupoRepository", () => {
  it("buscarPorGrupo sin tx usa prisma", async () => {
    mockPrisma.miembroGrupo.findMany.mockResolvedValue([{ idUsuario: "u1" }]);
    const result = await repo.buscarPorGrupo("g1");
    expect(result).toHaveLength(1);
    expect(mockPrisma.miembroGrupo.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1" },
      select: { idUsuario: true },
    });
  });

  it("buscarPorGrupo con tx usa el cliente de transaccion", async () => {
    const tx = {
      miembroGrupo: {
        findMany: jest.fn().mockResolvedValue([{ idUsuario: "u1" }]),
      },
    };
    const result = await repo.buscarPorGrupo("g1", tx as any);
    expect(result).toHaveLength(1);
    expect(tx.miembroGrupo.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1" },
      select: { idUsuario: true },
    });
  });

  it("crearMuchas sin tx usa prisma", async () => {
    const data = [{ idGrupo: "g1", idUsuario: "u1", rol: "admin" }];
    await repo.crearMuchas(data);
    expect(mockPrisma.miembroGrupo.createMany).toHaveBeenCalledWith({ data });
  });

  it("crearMuchas con tx usa el cliente de transaccion", async () => {
    const tx = { miembroGrupo: { createMany: jest.fn() } };
    const data = [{ idGrupo: "g1", idUsuario: "u1", rol: "admin" }];
    await repo.crearMuchas(data, tx as any);
    expect(tx.miembroGrupo.createMany).toHaveBeenCalledWith({ data });
  });

  it("buscarPorUsuario retorna membresias con grupos", async () => {
    mockPrisma.miembroGrupo.findMany.mockResolvedValue([
      { id: "m1", grupo: { id: "g1", _count: { miembros: 2 } } },
    ]);
    const result = await repo.buscarPorUsuario("u1");
    expect(result).toHaveLength(1);
    expect(mockPrisma.miembroGrupo.findMany).toHaveBeenCalledWith({
      where: { idUsuario: "u1" },
      include: {
        grupo: { include: { _count: { select: { miembros: true } } } },
      },
    });
  });

  it("buscarMiembrosDeGrupos retorna miembros sin duplicados", async () => {
    mockPrisma.miembroGrupo.findMany.mockResolvedValue([
      { idUsuario: "u1", usuario: { id: "u1", nombre: "A" } },
    ]);
    const result = await repo.buscarMiembrosDeGrupos(["g1"]);
    expect(result).toHaveLength(1);
    expect(mockPrisma.miembroGrupo.findMany).toHaveBeenCalledWith({
      where: { idGrupo: { in: ["g1"] } },
      include: { usuario: { select: { id: true, nombre: true } } },
      distinct: ["idUsuario"],
    });
  });

  it("buscarMiembrosDeGrupos retorna vacio si idsGrupos vacio", async () => {
    const result = await repo.buscarMiembrosDeGrupos([]);
    expect(result).toEqual([]);
    expect(mockPrisma.miembroGrupo.findMany).not.toHaveBeenCalled();
  });
});
