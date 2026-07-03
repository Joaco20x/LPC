import {
  obtenerDeudasPendientes,
  pagarDeuda,
} from "@/deudas/services/deudas.service";

function crearMockDeudaRepo() {
  return {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerPorId: jest.fn(),
    actualizarEstado: jest.fn(),
  };
}

function crearDeuda(
  id: string,
  idDeudor: string,
  idAcreedor: string,
  monto: number,
  grupoId: string,
) {
  return {
    id,
    idDeudor,
    idAcreedor,
    monto,
    grupo: { id: grupoId, nombre: "Grupo Test" },
    deudor: { id: idDeudor, nombre: "Deudor", correo: "deudor@test.com" },
    acreedor: {
      id: idAcreedor,
      nombre: "Acreedor",
      correo: "acreedor@test.com",
    },
    actualizadoEn: new Date(),
  } as any;
}

describe("obtenerDeudasPendientes", () => {
  it("separa deudas en debo_a y me_deben", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([
      crearDeuda("d1", "user-1", "user-2", 100, "g1"),
      crearDeuda("d2", "user-2", "user-1", 50, "g1"),
      crearDeuda("d3", "user-1", "user-3", 75, "g1"),
    ]);

    const resultado = await obtenerDeudasPendientes("user-1", deudaRepo);

    expect(resultado.debo_a).toHaveLength(2); // user-1 es deudor en d1 y d3
    expect(resultado.me_deben).toHaveLength(1); // user-1 es acreedor en d2
  });

  it("retorna arrays vacíos si no hay deudas", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([]);

    const resultado = await obtenerDeudasPendientes("user-1", deudaRepo);

    expect(resultado.debo_a).toHaveLength(0);
    expect(resultado.me_deben).toHaveLength(0);
  });

  it("filtra por grupo si se proporciona idGrupo", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPendientes.mockResolvedValue([]);

    await obtenerDeudasPendientes("user-1", deudaRepo, "g1");

    expect(deudaRepo.obtenerPendientes).toHaveBeenCalledWith("user-1", "g1");
  });
});

describe("pagarDeuda", () => {
  function crearDeudaCompleta(overrides: Record<string, unknown> = {}) {
    return {
      id: "d1",
      idDeudor: "user-1",
      idAcreedor: "user-2",
      monto: 100,
      moneda: "CLP",
      saldada: false,
      estado: "pendiente",
      actualizadoEn: new Date(),
      pagadaEn: null,
      idGrupo: "g1",
      grupo: { id: "g1", nombre: "Grupo Test" },
      deudor: { id: "user-1", nombre: "Deudor", correo: "deudor@t.com" },
      acreedor: {
        id: "user-2",
        nombre: "Acreedor",
        correo: "acreedor@t.com",
      },
      ...overrides,
    } as any;
  }

  it("marca deuda como pagada exitosamente", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPorId.mockResolvedValue(crearDeudaCompleta());

    await pagarDeuda("d1", "user-1", deudaRepo);

    expect(deudaRepo.actualizarEstado).toHaveBeenCalledWith(
      "d1",
      "pagada",
      expect.any(Date),
    );
  });

  it("lanza error si la deuda no existe", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPorId.mockResolvedValue(null);

    await expect(pagarDeuda("no-existe", "user-1", deudaRepo)).rejects.toThrow(
      "Deuda no encontrada",
    );
  });

  it("lanza error si el usuario no es el deudor", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPorId.mockResolvedValue(crearDeudaCompleta());

    await expect(pagarDeuda("d1", "user-2", deudaRepo)).rejects.toThrow(
      "Solo el deudor puede marcar la deuda como pagada",
    );
  });

  it("lanza error si la deuda ya esta saldada", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPorId.mockResolvedValue(
      crearDeudaCompleta({ saldada: true }),
    );

    await expect(pagarDeuda("d1", "user-1", deudaRepo)).rejects.toThrow(
      "La deuda ya está pagada",
    );
  });

  it("lanza error si la deuda ya esta pagada", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerPorId.mockResolvedValue(
      crearDeudaCompleta({ estado: "pagada" }),
    );

    await expect(pagarDeuda("d1", "user-1", deudaRepo)).rejects.toThrow(
      "La deuda ya está pagada",
    );
  });
});
