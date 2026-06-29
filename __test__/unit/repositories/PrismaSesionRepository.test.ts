const mockPrisma = {
  sesion: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaSesionRepository } from "@/auth/repositories/PrismaSesionRepository";

const repo = new PrismaSesionRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaSesionRepository", () => {
  it("crear crea una sesion", async () => {
    const data = { idUsuario: "u1", tokenHash: "hash", expiraEn: new Date() };
    mockPrisma.sesion.create.mockResolvedValue({ id: "s1", ...data });
    const result = await repo.crear(data);
    expect(result.id).toBe("s1");
    expect(mockPrisma.sesion.create).toHaveBeenCalledWith({ data });
  });

  it("buscarPorTokenHash retorna sesion valida", async () => {
    mockPrisma.sesion.findFirst.mockResolvedValue({ id: "s1" });
    const result = await repo.buscarPorTokenHash("hash");
    expect(result?.id).toBe("s1");
    expect(mockPrisma.sesion.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: "hash", expiraEn: { gt: expect.any(Date) } },
    });
  });

  it("buscarPorTokenHash retorna null si no encuentra", async () => {
    mockPrisma.sesion.findFirst.mockResolvedValue(null);
    const result = await repo.buscarPorTokenHash("no-existe");
    expect(result).toBeNull();
  });

  it("actualizarTokenHash actualiza el hash", async () => {
    await repo.actualizarTokenHash("s1", "nuevo-hash");
    expect(mockPrisma.sesion.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { tokenHash: "nuevo-hash" },
    });
  });

  it("eliminarPorTokenHash elimina sesiones por hash", async () => {
    await repo.eliminarPorTokenHash("hash");
    expect(mockPrisma.sesion.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: "hash" },
    });
  });

  it("eliminarPorIdUsuario elimina sesiones por usuario", async () => {
    await repo.eliminarPorIdUsuario("u1");
    expect(mockPrisma.sesion.deleteMany).toHaveBeenCalledWith({
      where: { idUsuario: "u1" },
    });
  });
});
