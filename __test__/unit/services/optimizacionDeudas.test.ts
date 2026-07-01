import {
  calcularBalancesYOptimizacion,
  saldarTransferenciaSugerida,
} from "@/deudas/services/optimizacionDeudas.service";

function crearMockDeudaRepo() {
  return {
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    obtenerTodasPorGrupo: jest.fn(),
    marcarComoSaldadas: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

function crearDeuda(
  id: string,
  idDeudor: string,
  idAcreedor: string,
  monto: number,
) {
  return {
    id,
    idDeudor,
    idAcreedor,
    monto,
    deudor: { id: idDeudor, nombre: "Deudor", correo: "deudor@test.com" },
    acreedor: {
      id: idAcreedor,
      nombre: "Acreedor",
      correo: "acreedor@test.com",
    },
    grupo: { id: "g1", nombre: "Grupo Test" },
    actualizadoEn: new Date(),
  } as any;
}

describe("calcularBalancesYOptimizacion", () => {
  it("calcula balances y sugiere transferencias optimizadas", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([
      crearDeuda("d1", "u1", "u2", 100),
      crearDeuda("d2", "u2", "u1", 30),
      crearDeuda("d3", "u1", "u3", 50),
    ]);

    const resultado = await calcularBalancesYOptimizacion("g1", deudaRepo);

    expect(resultado.balances).toHaveLength(3);
    expect(resultado.transferenciasSugeridas.length).toBeGreaterThan(0);
    expect(resultado.estadisticas.transferenciasSinOptimizar).toBe(3);
  });

  it("retorna arrays vacios si no hay deudas", async () => {
    const deudaRepo = crearMockDeudaRepo();
    deudaRepo.obtenerTodasPorGrupo.mockResolvedValue([]);

    const resultado = await calcularBalancesYOptimizacion("g1", deudaRepo);

    expect(resultado.balances).toHaveLength(0);
    expect(resultado.transferenciasSugeridas).toHaveLength(0);
    expect(resultado.estadisticas.transferenciasSinOptimizar).toBe(0);
  });
});

describe("saldarTransferenciaSugerida", () => {
  it("marca deudas originales como saldadas sin crear deuda inversa", async () => {
    const deudaRepo = crearMockDeudaRepo();

    await saldarTransferenciaSugerida("g1", "u1", "u2", 100, deudaRepo);

    expect(deudaRepo.marcarComoSaldadas).toHaveBeenCalledWith("g1", "u1", "u2");
    expect(deudaRepo.crearMuchas).not.toHaveBeenCalled();
  });
});
