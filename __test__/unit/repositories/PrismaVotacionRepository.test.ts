const mockVotoIndividual = {
  create: jest.fn(),
};

const mockVotacion = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

jest.mock("@/shared/libs/prisma", () => ({
  prisma: {
    votacion: mockVotacion,
    votoIndividual: mockVotoIndividual,
  },
}));

import { PrismaVotacionRepository } from "@/votaciones/repositories/PrismaVotacionRepository";

const repo = new PrismaVotacionRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

function crearVotacionRaw(overrides: Record<string, unknown> = {}) {
  return {
    id: "v1",
    idGrupo: "g1",
    idDeuda: "d1",
    idCreador: "u1",
    tipo: "abstencion",
    estado: "activa",
    resultado: null,
    creadoEn: new Date(),
    resueltaEn: null,
    votos: [],
    deuda: {
      grupo: {
        miembros: [
          { idUsuario: "u1" },
          { idUsuario: "u2" },
          { idUsuario: "u3" },
        ],
      },
    },
    ...overrides,
  };
}

describe("PrismaVotacionRepository.crear", () => {
  it("crea votacion y retorna id", async () => {
    mockVotacion.create.mockResolvedValue({ id: "v1" });
    const result = await repo.crear({
      idGrupo: "g1",
      idDeuda: "d1",
      idCreador: "u1",
      tipo: "denuncia",
    });
    expect(result).toEqual({ id: "v1" });
  });
});

describe("PrismaVotacionRepository.buscarPorId", () => {
  it("retorna null si no existe", async () => {
    mockVotacion.findUnique.mockResolvedValue(null);
    const result = await repo.buscarPorId("no-existe");
    expect(result).toBeNull();
  });

  it("retorna votacion mapeada si existe", async () => {
    mockVotacion.findUnique.mockResolvedValue(crearVotacionRaw());
    const result = await repo.buscarPorId("v1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("v1");
    expect(result!.totalMiembros).toBe(3);
    expect(result!.aprobaciones).toBe(0);
    expect(result!.rechazos).toBe(0);
    expect(result!.pendientes).toBe(3);
  });

  it("mapea correctamente votos", async () => {
    mockVotacion.findUnique.mockResolvedValue(
      crearVotacionRaw({
        votos: [
          {
            idUsuario: "u1",
            decision: "aprobar",
            usuario: { id: "u1", nombre: "User 1" },
          },
          {
            idUsuario: "u2",
            decision: "rechazar",
            usuario: { id: "u2", nombre: "User 2" },
          },
        ],
      }),
    );
    const result = await repo.buscarPorId("v1");
    expect(result!.aprobaciones).toBe(1);
    expect(result!.rechazos).toBe(1);
    expect(result!.pendientes).toBe(1);
    expect(result!.votos).toHaveLength(2);
  });

  it("usa 0 como totalMiembros si no hay deuda.grupo", async () => {
    mockVotacion.findUnique.mockResolvedValue(
      crearVotacionRaw({ deuda: null }),
    );
    const result = await repo.buscarPorId("v1");
    expect(result!.totalMiembros).toBe(0);
  });
});

describe("PrismaVotacionRepository.buscarPorGrupo", () => {
  it("retorna lista de votaciones del grupo", async () => {
    mockVotacion.findMany.mockResolvedValue([
      crearVotacionRaw({ id: "v1" }),
      crearVotacionRaw({ id: "v2" }),
    ]);
    const result = await repo.buscarPorGrupo("g1");
    expect(result).toHaveLength(2);
  });
});

describe("PrismaVotacionRepository.buscarPorDeuda", () => {
  it("retorna votacion activa para la deuda", async () => {
    mockVotacion.findFirst.mockResolvedValue(crearVotacionRaw());
    const result = await repo.buscarPorDeuda("d1");
    expect(result).not.toBeNull();
  });

  it("retorna null si no hay votacion activa", async () => {
    mockVotacion.findFirst.mockResolvedValue(null);
    const result = await repo.buscarPorDeuda("d1");
    expect(result).toBeNull();
  });
});

describe("PrismaVotacionRepository.registrarVoto", () => {
  it("crea voto individual", async () => {
    await repo.registrarVoto("v1", "u1", "aprobar");
    expect(mockVotoIndividual.create).toHaveBeenCalledWith({
      data: { idVotacion: "v1", idUsuario: "u1", decision: "aprobar" },
    });
  });
});

describe("PrismaVotacionRepository.resolver", () => {
  it("actualiza estado a resuelta con resultado", async () => {
    await repo.resolver("v1", "aprobada");
    expect(mockVotacion.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: {
        estado: "resuelta",
        resultado: "aprobada",
        resueltaEn: expect.any(Date),
      },
    });
  });
});
