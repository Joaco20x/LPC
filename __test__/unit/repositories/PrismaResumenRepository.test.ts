const mockPrisma = {
  resumenMensual: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaResumenRepository } from "@/resumen/repositories/PrismaResumenRepository";

const repo = new PrismaResumenRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaResumenRepository", () => {
  const data = {
    idGrupo: "g1",
    mes: 6,
    anio: 2026,
    totalGastos: 1500,
    datosJson: {
      totalGastos: 1500,
      porCategoria: {},
      porIntegrante: {},
    },
  };

  it("crear guarda un resumen mensual", async () => {
    mockPrisma.resumenMensual.create.mockResolvedValue({ id: "r1", ...data });

    const result = await repo.crear(data);

    expect(result.id).toBe("r1");
    expect(mockPrisma.resumenMensual.create).toHaveBeenCalledWith({ data });
  });

  it("obtenerPorGrupoYMes retorna resumen cuando existe", async () => {
    const esperado = {
      id: "r1",
      idGrupo: "g1",
      mes: 6,
      anio: 2026,
    };
    mockPrisma.resumenMensual.findUnique.mockResolvedValue(esperado);

    const result = await repo.obtenerPorGrupoYMes("g1", 6, 2026);

    expect(result?.id).toBe("r1");
    expect(mockPrisma.resumenMensual.findUnique).toHaveBeenCalledWith({
      where: {
        idGrupo_mes_anio: { idGrupo: "g1", mes: 6, anio: 2026 },
      },
    });
  });

  it("obtenerPorGrupoYMes retorna null cuando no existe", async () => {
    mockPrisma.resumenMensual.findUnique.mockResolvedValue(null);

    const result = await repo.obtenerPorGrupoYMes("g1", 6, 2026);

    expect(result).toBeNull();
  });

  it("obtenerHistorialPorGrupo retorna resúmenes ordenados descendente", async () => {
    const resumenes = [
      { id: "r3", mes: 7, anio: 2026 },
      { id: "r2", mes: 6, anio: 2026 },
      { id: "r1", mes: 5, anio: 2026 },
    ];
    mockPrisma.resumenMensual.findMany.mockResolvedValue(resumenes);

    const result = await repo.obtenerHistorialPorGrupo("g1");

    expect(result).toHaveLength(3);
    expect(mockPrisma.resumenMensual.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1" },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });
  });
});
