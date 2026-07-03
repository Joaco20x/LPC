const mockInvitacion = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

jest.mock("@/shared/libs/prisma", () => ({
  prisma: { invitacion: mockInvitacion },
}));

import { PrismaInvitacionRepository } from "@/invitaciones/repositories/PrismaInvitacionRepository";

const repo = new PrismaInvitacionRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

function crearInvitacionRaw(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    idGrupo: "g1",
    idInvitador: "u1",
    correoInvitado: null,
    token: "token-123",
    tipo: "enlace",
    expiraEn: new Date(Date.now() + 86400000),
    usado: false,
    creadoEn: new Date(),
    ...overrides,
  };
}

describe("PrismaInvitacionRepository.crear", () => {
  it("crea invitacion y retorna id y token", async () => {
    mockInvitacion.create.mockResolvedValue({ id: "inv-1", token: "tok-1" });
    const result = await repo.crear({
      idGrupo: "g1",
      token: "tok-1",
      tipo: "enlace",
      expiraEn: new Date(),
    });
    expect(result).toEqual({ id: "inv-1", token: "tok-1" });
    expect(mockInvitacion.create).toHaveBeenCalled();
  });
});

describe("PrismaInvitacionRepository.buscarPorToken", () => {
  it("retorna invitacion con estado pendiente si es valida", async () => {
    mockInvitacion.findUnique.mockResolvedValue(crearInvitacionRaw());
    const result = await repo.buscarPorToken("token-123");
    expect(result).not.toBeNull();
    expect(result!.estado).toBe("pendiente");
  });

  it("retorna null si no existe", async () => {
    mockInvitacion.findUnique.mockResolvedValue(null);
    const result = await repo.buscarPorToken("no-existe");
    expect(result).toBeNull();
  });

  it("retorna estado aceptada si usado es true", async () => {
    mockInvitacion.findUnique.mockResolvedValue(
      crearInvitacionRaw({ usado: true }),
    );
    const result = await repo.buscarPorToken("token-123");
    expect(result!.estado).toBe("aceptada");
  });

  it("retorna estado expirada si la fecha ya paso", async () => {
    mockInvitacion.findUnique.mockResolvedValue(
      crearInvitacionRaw({
        expiraEn: new Date(Date.now() - 86400000),
      }),
    );
    const result = await repo.buscarPorToken("token-123");
    expect(result!.estado).toBe("expirada");
  });
});

describe("PrismaInvitacionRepository.buscarPorGrupo", () => {
  it("retorna lista de invitaciones del grupo", async () => {
    mockInvitacion.findMany.mockResolvedValue([
      crearInvitacionRaw({ id: "inv-1", token: "t1" }),
      crearInvitacionRaw({ id: "inv-2", token: "t2" }),
    ]);
    const result = await repo.buscarPorGrupo("g1");
    expect(result).toHaveLength(2);
    expect(mockInvitacion.findMany).toHaveBeenCalledWith({
      where: { idGrupo: "g1" },
      orderBy: { creadoEn: "desc" },
    });
  });
});

describe("PrismaInvitacionRepository.marcarComoUsada", () => {
  it("actualiza usado a true", async () => {
    await repo.marcarComoUsada("token-123");
    expect(mockInvitacion.update).toHaveBeenCalledWith({
      where: { token: "token-123" },
      data: { usado: true },
    });
  });
});

describe("PrismaInvitacionRepository.invalidarPorGrupoYCorreo", () => {
  it("marca como usadas las invitaciones previas del correo en el grupo", async () => {
    await repo.invalidarPorGrupoYCorreo("g1", "test@test.com");
    expect(mockInvitacion.updateMany).toHaveBeenCalledWith({
      where: {
        idGrupo: "g1",
        correoInvitado: "test@test.com",
        usado: false,
      },
      data: { usado: true },
    });
  });
});
