const mockPrisma = {
  comprobantePago: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaComprobanteRepository } from "@/deudas/repositories/PrismaComprobanteRepository";

const repo = new PrismaComprobanteRepository();

function mockPrismaItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    idDeuda: "d1",
    idUsuario: "u1",
    urlArchivo: "/uploads/comprobantes/test.pdf",
    tipoArchivo: "application/pdf",
    rut: "12345678-5",
    estado: "pendiente",
    aceptadoEn: null,
    rechazadoEn: null,
    creadoEn: new Date("2026-07-01"),
    usuario: { id: "u1", nombre: "Usuario", correo: "u1@t.com" },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaComprobanteRepository", () => {
  it("crear llama a create con los datos y retorna el item mapeado", async () => {
    const prismaItem = mockPrismaItem();
    mockPrisma.comprobantePago.create.mockResolvedValue(prismaItem);

    const result = await repo.crear({
      idDeuda: "d1",
      idUsuario: "u1",
      urlArchivo: "/uploads/comprobantes/test.pdf",
      tipoArchivo: "application/pdf",
      rut: "12345678-5",
    });

    expect(result.id).toBe("c1");
    expect(result.estado).toBe("pendiente");
    expect(mockPrisma.comprobantePago.create).toHaveBeenCalledWith({
      data: {
        idDeuda: "d1",
        idUsuario: "u1",
        urlArchivo: "/uploads/comprobantes/test.pdf",
        tipoArchivo: "application/pdf",
        rut: "12345678-5",
      },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  });

  it("obtenerPorDeuda retorna lista de comprobantes", async () => {
    const items = [mockPrismaItem(), mockPrismaItem({ id: "c2" })];
    mockPrisma.comprobantePago.findMany.mockResolvedValue(items);

    const result = await repo.obtenerPorDeuda("d1");

    expect(result).toHaveLength(2);
    expect(mockPrisma.comprobantePago.findMany).toHaveBeenCalledWith({
      where: { idDeuda: "d1" },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
      orderBy: { creadoEn: "desc" },
    });
  });

  it("obtenerPorDeuda retorna array vacío si no hay comprobantes", async () => {
    mockPrisma.comprobantePago.findMany.mockResolvedValue([]);

    const result = await repo.obtenerPorDeuda("sin-comprobantes");

    expect(result).toHaveLength(0);
  });

  it("obtenerPorId retorna comprobante si existe", async () => {
    const prismaItem = mockPrismaItem();
    mockPrisma.comprobantePago.findUnique.mockResolvedValue(prismaItem);

    const result = await repo.obtenerPorId("c1");

    expect(result?.id).toBe("c1");
    expect(result?.usuario.nombre).toBe("Usuario");
    expect(mockPrisma.comprobantePago.findUnique).toHaveBeenCalledWith({
      where: { id: "c1" },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  });

  it("obtenerPorId retorna null si no existe", async () => {
    mockPrisma.comprobantePago.findUnique.mockResolvedValue(null);

    const result = await repo.obtenerPorId("no-existe");

    expect(result).toBeNull();
  });

  it("actualizarEstado a aceptado actualiza estado y aceptadoEn", async () => {
    const prismaItem = mockPrismaItem({
      estado: "aceptado",
      aceptadoEn: new Date(),
    });
    mockPrisma.comprobantePago.update.mockResolvedValue(prismaItem);

    const result = await repo.actualizarEstado("c1", "aceptado");

    expect(result.estado).toBe("aceptado");
    expect(mockPrisma.comprobantePago.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { estado: "aceptado", aceptadoEn: expect.any(Date) },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  });

  it("actualizarEstado a rechazado actualiza estado y rechazadoEn", async () => {
    const prismaItem = mockPrismaItem({
      estado: "rechazado",
      rechazadoEn: new Date(),
    });
    mockPrisma.comprobantePago.update.mockResolvedValue(prismaItem);

    const result = await repo.actualizarEstado("c1", "rechazado");

    expect(result.estado).toBe("rechazado");
    expect(mockPrisma.comprobantePago.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { estado: "rechazado", rechazadoEn: expect.any(Date) },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  });

  it("_map maneja null en fechas correctamente", async () => {
    const prismaItem = mockPrismaItem({
      aceptadoEn: new Date("2026-07-02"),
      rechazadoEn: null,
    });
    mockPrisma.comprobantePago.findUnique.mockResolvedValue(prismaItem);

    const result = await repo.obtenerPorId("c1");

    expect(result?.aceptadoEn).toBeInstanceOf(Date);
    expect(result?.rechazadoEn).toBeNull();
  });
});
