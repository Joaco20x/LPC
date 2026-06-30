const mockPrisma = {
  notificacion: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("@/shared/libs/prisma", () => ({ prisma: mockPrisma }));

import { PrismaNotificacionRepository } from "@/notificaciones/repositories/PrismaNotificacionRepository";

const repo = new PrismaNotificacionRepository();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaNotificacionRepository", () => {
  it("crear llama a prisma.notificacion.create con metadata como JSON", async () => {
    const datos = {
      idUsuario: "u1",
      tipo: "nuevo_gasto" as const,
      metadata: { monto: 100 },
    };
    mockPrisma.notificacion.create.mockResolvedValue({ id: "n1", ...datos });

    const result = await repo.crear(datos);
    expect(result.id).toBe("n1");
    expect(mockPrisma.notificacion.create).toHaveBeenCalledWith({
      data: { ...datos, metadata: datos.metadata },
    });
  });

  it("crearMuchas con datos llama a prisma.notificacion.createMany", async () => {
    const datos = [
      {
        idUsuario: "u1",
        tipo: "nuevo_gasto" as const,
        metadata: { monto: 100 },
      },
      {
        idUsuario: "u2",
        tipo: "nuevo_gasto" as const,
        metadata: { monto: 200 },
      },
    ];

    await repo.crearMuchas(datos);
    expect(mockPrisma.notificacion.createMany).toHaveBeenCalledWith({
      data: datos.map((d) => ({ ...d, metadata: d.metadata })),
    });
  });

  it("crearMuchas con array vacio no llama prisma", async () => {
    await repo.crearMuchas([]);
    expect(mockPrisma.notificacion.createMany).not.toHaveBeenCalled();
  });

  it("obtenerPorUsuario retorna notificaciones ordenadas por fecha descendente con limite 50", async () => {
    const notificaciones = [
      { id: "n1", idUsuario: "u1", tipo: "nuevo_gasto" },
      { id: "n2", idUsuario: "u1", tipo: "pago_deuda" },
    ];
    mockPrisma.notificacion.findMany.mockResolvedValue(notificaciones);

    const result = await repo.obtenerPorUsuario("u1");
    expect(result).toEqual(notificaciones);
    expect(mockPrisma.notificacion.findMany).toHaveBeenCalledWith({
      where: { idUsuario: "u1" },
      orderBy: { creadoEn: "desc" },
      take: 50,
    });
  });

  it("marcarLeida actualiza notificacion por id y usuario", async () => {
    await repo.marcarLeida("n1", "u1");
    expect(mockPrisma.notificacion.updateMany).toHaveBeenCalledWith({
      where: { id: "n1", idUsuario: "u1" },
      data: { leida: true },
    });
  });

  it("marcarTodasLeidas actualiza todas las no leidas del usuario", async () => {
    await repo.marcarTodasLeidas("u1");
    expect(mockPrisma.notificacion.updateMany).toHaveBeenCalledWith({
      where: { idUsuario: "u1", leida: false },
      data: { leida: true },
    });
  });

  it("contarNoLeidas retorna el conteo de notificaciones no leidas", async () => {
    mockPrisma.notificacion.count.mockResolvedValue(5);
    const result = await repo.contarNoLeidas("u1");
    expect(result).toBe(5);
    expect(mockPrisma.notificacion.count).toHaveBeenCalledWith({
      where: { idUsuario: "u1", leida: false },
    });
  });
});
