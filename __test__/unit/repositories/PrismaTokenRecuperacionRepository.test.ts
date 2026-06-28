const mockPrisma = {
  tokenRecuperacion: {
    updateMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaTokenRecuperacionRepository } from "@/auth/repositories/PrismaTokenRecuperacionRepository";

const repo = new PrismaTokenRecuperacionRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaTokenRecuperacionRepository", () => {
  it("invalidarPorIdUsuario marca como usados", async () => {
    await repo.invalidarPorIdUsuario("u1");
    expect(mockPrisma.tokenRecuperacion.updateMany).toHaveBeenCalledWith({
      where: { idUsuario: "u1", usado: false },
      data: { usado: true },
    });
  });

  it("crear crea un token de recuperacion", async () => {
    const data = { idUsuario: "u1", token: "tok", expiraEn: new Date() };
    mockPrisma.tokenRecuperacion.create.mockResolvedValue({
      id: "t1",
      ...data,
    });
    const result = await repo.crear(data);
    expect(result.id).toBe("t1");
    expect(mockPrisma.tokenRecuperacion.create).toHaveBeenCalledWith({ data });
  });

  it("buscarTokenValido retorna token valido", async () => {
    mockPrisma.tokenRecuperacion.findFirst.mockResolvedValue({ id: "t1" });
    const result = await repo.buscarTokenValido("tok");
    expect(result?.id).toBe("t1");
    expect(mockPrisma.tokenRecuperacion.findFirst).toHaveBeenCalledWith({
      where: { token: "tok", usado: false, expiraEn: { gt: expect.any(Date) } },
    });
  });

  it("buscarTokenValido retorna null si no existe", async () => {
    mockPrisma.tokenRecuperacion.findFirst.mockResolvedValue(null);
    const result = await repo.buscarTokenValido("no-existe");
    expect(result).toBeNull();
  });

  it("marcarComoUsado actualiza el token", async () => {
    await repo.marcarComoUsado("t1");
    expect(mockPrisma.tokenRecuperacion.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { usado: true },
    });
  });
});
