const mockPrisma = {
  usuario: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaUsuarioRepository } from "@/auth/repositories/PrismaUsuarioRepository";

const repo = new PrismaUsuarioRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaUsuarioRepository", () => {
  it("buscarPorCorreo retorna usuario", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({ id: "u1", correo: "a@b.com" });
    const result = await repo.buscarPorCorreo("a@b.com");
    expect(result?.id).toBe("u1");
    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({ where: { correo: "a@b.com" } });
  });

  it("buscarPorCorreo retorna null si no existe", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    const result = await repo.buscarPorCorreo("no@existe.com");
    expect(result).toBeNull();
  });

  it("buscarPorId retorna usuario", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({ id: "u1" });
    const result = await repo.buscarPorId("u1");
    expect(result?.id).toBe("u1");
  });

  it("buscarPorId retorna null si no existe", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);
    const result = await repo.buscarPorId("no-existe");
    expect(result).toBeNull();
  });

  it("buscarPorOauth retorna usuario por proveedor", async () => {
    mockPrisma.usuario.findFirst.mockResolvedValue({ id: "u1" });
    const result = await repo.buscarPorOauth("google", "id123");
    expect(result?.id).toBe("u1");
    expect(mockPrisma.usuario.findFirst).toHaveBeenCalledWith({
      where: { proveedorOauth: "google", idProveedorOauth: "id123" },
    });
  });

  it("buscarPorEmails retorna usuarios", async () => {
    mockPrisma.usuario.findMany.mockResolvedValue([{ id: "u1", nombre: "A", correo: "a@b.com" }]);
    const result = await repo.buscarPorEmails(["a@b.com"]);
    expect(result).toHaveLength(1);
    expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
      where: { correo: { in: ["a@b.com"] } },
      select: { id: true, nombre: true, correo: true },
    });
  });

  it("crear crea un usuario", async () => {
    const data = { nombre: "A", correo: "a@b.com", contrasenaHash: "hash", verificado: false };
    mockPrisma.usuario.create.mockResolvedValue({ id: "u1", ...data });
    const result = await repo.crear(data);
    expect(result.id).toBe("u1");
    expect(mockPrisma.usuario.create).toHaveBeenCalledWith({ data });
  });

  it("actualizarContrasena actualiza el hash", async () => {
    await repo.actualizarContrasena("u1", "nuevo-hash");
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { contrasenaHash: "nuevo-hash" },
    });
  });
});
