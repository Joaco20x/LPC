import { ComprobanteService } from "@/deudas/services/comprobante.service";
import type { DeudaConRelaciones } from "@/deudas/repositories/IDeudaRepository";
import type { ComprobanteItem } from "@/deudas/types/comprobante";

function crearMockComprobanteRepo() {
  return {
    crear: jest.fn<
      (data: {
        idDeuda: string;
        idUsuario: string;
        urlArchivo: string;
        tipoArchivo: string;
        rut: string;
      }) => Promise<ComprobanteItem>,
      []
    >(),
    obtenerPorDeuda: jest.fn<
      (idDeuda: string) => Promise<ComprobanteItem[]>,
      []
    >(),
    obtenerPorId: jest.fn<
      (id: string) => Promise<ComprobanteItem | null>,
      []
    >(),
    actualizarEstado: jest.fn<
      (
        id: string,
        estado: "aceptado" | "rechazado",
      ) => Promise<ComprobanteItem>,
      []
    >(),
  };
}

function crearMockDeudaRepo() {
  return {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerTodasPorGrupo: jest.fn(),
    marcarComoSaldadas: jest.fn(),
    obtenerPorId: jest.fn<
      (id: string) => Promise<DeudaConRelaciones | null>,
      []
    >(),
    actualizarEstado: jest.fn<
      (id: string, estado: string, pagadaEn?: Date | null) => Promise<void>,
      []
    >(),
  };
}

function crearDeuda(
  id: string,
  idDeudor: string,
  idAcreedor: string,
  saldada = false,
  estado = "pendiente",
) {
  return {
    id,
    idDeudor,
    idAcreedor,
    monto: 100,
    saldada,
    estado,
    actualizadoEn: new Date(),
    pagadaEn: null,
    grupo: { id: "g1", nombre: "Grupo Test" },
    deudor: { id: idDeudor, nombre: "Deudor", correo: "deudor@t.com" },
    acreedor: {
      id: idAcreedor,
      nombre: "Acreedor",
      correo: "acreedor@t.com",
    },
  } as unknown as DeudaConRelaciones;
}

function crearComprobante(
  id: string,
  idDeuda: string,
  idUsuario: string,
  estado: "pendiente" | "aceptado" | "rechazado" = "pendiente",
): ComprobanteItem {
  return {
    id,
    idDeuda,
    idUsuario,
    urlArchivo: "/uploads/comprobantes/test.pdf",
    tipoArchivo: "application/pdf",
    rut: "12345678-5",
    estado,
    aceptadoEn: null,
    rechazadoEn: null,
    creadoEn: new Date(),
    usuario: { id: idUsuario, nombre: "Usuario", correo: "u@t.com" },
  };
}

function crearService(
  mockComprobanteRepo: ReturnType<typeof crearMockComprobanteRepo>,
  mockDeudaRepo: ReturnType<typeof crearMockDeudaRepo>,
) {
  return new ComprobanteService(mockComprobanteRepo, mockDeudaRepo);
}

describe("ComprobanteService.subir", () => {
  it("sube comprobante exitosamente si el deudor es quien sube", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.crear.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );

    const result = await service.subir(
      "d1",
      "u1",
      "12345678-5",
      "/uploads/comprobantes/test.pdf",
      "application/pdf",
    );

    expect(result.id).toBe("c1");
    expect(mockComprobanteRepo.crear).toHaveBeenCalledWith({
      idDeuda: "d1",
      idUsuario: "u1",
      urlArchivo: "/uploads/comprobantes/test.pdf",
      tipoArchivo: "application/pdf",
      rut: "12345678-5",
    });
  });

  it("lanza error si la deuda no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    await expect(
      service.subir("no-existe", "u1", "12345678-5", "/url", "application/pdf"),
    ).rejects.toThrow("Deuda no encontrada");
  });

  it("lanza error si el usuario no es el deudor", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(
      service.subir("d1", "u2", "12345678-5", "/url", "application/pdf"),
    ).rejects.toThrow("Solo el deudor puede subir un comprobante");
  });

  it("lanza error si la deuda ya está saldada", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(
      crearDeuda("d1", "u1", "u2", true),
    );

    await expect(
      service.subir("d1", "u1", "12345678-5", "/url", "application/pdf"),
    ).rejects.toThrow("La deuda ya está saldada");
  });

  it("lanza error si el RUT es inválido", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(
      service.subir("d1", "u1", "12.345.678-0", "/url", "application/pdf"),
    ).rejects.toThrow("RUT inválido");
  });

  it("limpia puntos del RUT antes de validar y guardar", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.crear.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );

    const result = await service.subir(
      "d1",
      "u1",
      "12.345.678-5",
      "/url",
      "application/pdf",
    );

    expect(result.id).toBe("c1");
    expect(mockComprobanteRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ rut: "12345678-5" }),
    );
  });
});

describe("ComprobanteService.obtenerHistorial", () => {
  it("retorna comprobantes cuando el usuario es el deudor", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.obtenerPorDeuda.mockResolvedValue([
      crearComprobante("c1", "d1", "u1"),
    ]);

    const result = await service.obtenerHistorial("d1", "u1");

    expect(result).toHaveLength(1);
    expect(mockComprobanteRepo.obtenerPorDeuda).toHaveBeenCalledWith("d1");
  });

  it("retorna comprobantes cuando el usuario es el acreedor", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.obtenerPorDeuda.mockResolvedValue([
      crearComprobante("c1", "d1", "u1"),
    ]);

    const result = await service.obtenerHistorial("d1", "u2");

    expect(result).toHaveLength(1);
  });

  it("lanza error si la deuda no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    await expect(service.obtenerHistorial("no-existe", "u1")).rejects.toThrow(
      "Deuda no encontrada",
    );
  });

  it("lanza error si el usuario no participa en la deuda", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(service.obtenerHistorial("d1", "u3")).rejects.toThrow(
      "No tienes acceso a esta deuda",
    );
  });
});

describe("ComprobanteService.aceptar", () => {
  it("acepta comprobante y marca deuda como pagada", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockDeudaRepo.actualizarEstado.mockResolvedValue();
    mockComprobanteRepo.actualizarEstado.mockResolvedValue(
      crearComprobante("c1", "d1", "u1", "aceptado"),
    );

    const result = await service.aceptar("c1", "u2");

    expect(result.estado).toBe("aceptado");
    expect(mockDeudaRepo.actualizarEstado).toHaveBeenCalledWith(
      "d1",
      "pagada",
      expect.any(Date),
    );
    expect(mockComprobanteRepo.actualizarEstado).toHaveBeenCalledWith(
      "c1",
      "aceptado",
    );
  });

  it("lanza error si el comprobante no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(null);

    await expect(service.aceptar("no-existe", "u2")).rejects.toThrow(
      "Comprobante no encontrado",
    );
  });

  it("lanza error si la deuda asociada no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    await expect(service.aceptar("c1", "u2")).rejects.toThrow(
      "Deuda no encontrada",
    );
  });

  it("lanza error si quien acepta no es el acreedor", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(service.aceptar("c1", "u1")).rejects.toThrow(
      "Solo el acreedor puede aceptar el comprobante",
    );
  });

  it("lanza error si el comprobante ya fue procesado", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1", "aceptado"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(service.aceptar("c1", "u2")).rejects.toThrow(
      "El comprobante ya fue procesado",
    );
  });
});

describe("ComprobanteService.rechazar", () => {
  it("rechaza comprobante exitosamente", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.actualizarEstado.mockResolvedValue(
      crearComprobante("c1", "d1", "u1", "rechazado"),
    );

    const result = await service.rechazar("c1", "u2");

    expect(result.estado).toBe("rechazado");
    expect(mockComprobanteRepo.actualizarEstado).toHaveBeenCalledWith(
      "c1",
      "rechazado",
    );
  });

  it("lanza error si el comprobante no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(null);

    await expect(service.rechazar("no-existe", "u2")).rejects.toThrow(
      "Comprobante no encontrado",
    );
  });

  it("lanza error si la deuda asociada no existe", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    await expect(service.rechazar("c1", "u2")).rejects.toThrow(
      "Deuda no encontrada",
    );
  });

  it("lanza error si quien rechaza no es el acreedor", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(service.rechazar("c1", "u1")).rejects.toThrow(
      "Solo el acreedor puede rechazar el comprobante",
    );
  });

  it("lanza error si el comprobante ya fue procesado", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1", "rechazado"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));

    await expect(service.rechazar("c1", "u2")).rejects.toThrow(
      "El comprobante ya fue procesado",
    );
  });

  it("no marca deuda como pagada al rechazar", async () => {
    const mockComprobanteRepo = crearMockComprobanteRepo();
    const mockDeudaRepo = crearMockDeudaRepo();
    const service = crearService(mockComprobanteRepo, mockDeudaRepo);

    mockComprobanteRepo.obtenerPorId.mockResolvedValue(
      crearComprobante("c1", "d1", "u1"),
    );
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeuda("d1", "u1", "u2"));
    mockComprobanteRepo.actualizarEstado.mockResolvedValue(
      crearComprobante("c1", "d1", "u1", "rechazado"),
    );

    await service.rechazar("c1", "u2");

    expect(mockDeudaRepo.actualizarEstado).not.toHaveBeenCalled();
  });
});
