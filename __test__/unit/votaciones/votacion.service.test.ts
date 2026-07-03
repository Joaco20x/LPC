import {
  crearVotacion,
  emitirVoto,
  obtenerVotacionesGrupo,
  obtenerVotacion,
} from "@/votaciones/services/votacion.service";

function crearMockMiembroRepo() {
  return {
    buscarPorGrupo: jest.fn(),
    buscarPorUsuario: jest.fn(),
    crearMuchas: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
}

function crearMockVotacionRepo() {
  return {
    crear: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorGrupo: jest.fn(),
    buscarPorDeuda: jest.fn(),
    registrarVoto: jest.fn(),
    resolver: jest.fn(),
  };
}

function crearVotacionDetalle(overrides: Record<string, unknown> = {}) {
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
    totalMiembros: 3,
    aprobaciones: 0,
    rechazos: 0,
    pendientes: 3,
    votos: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("crearVotacion", () => {
  it("crea votacion exitosamente", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);
    votacionRepo.buscarPorDeuda.mockResolvedValue(null);
    votacionRepo.crear.mockResolvedValue({ id: "v1" });

    const result = await crearVotacion(
      "g1",
      "d1",
      "u1",
      "denuncia",
      votacionRepo,
      miembroRepo,
    );

    expect(result.id).toBe("v1");
  });

  it("lanza error si no es miembro del grupo", async () => {
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await expect(
      crearVotacion("g1", "d1", "u1", "denuncia", {} as any, miembroRepo),
    ).rejects.toThrow("No eres miembro de este grupo");
  });

  it("lanza error si ya existe votacion activa para la deuda", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);
    votacionRepo.buscarPorDeuda.mockResolvedValue(crearVotacionDetalle());

    await expect(
      crearVotacion("g1", "d1", "u1", "abstencion", votacionRepo, miembroRepo),
    ).rejects.toThrow("Ya existe una votación activa para esta deuda");
  });
});

describe("emitirVoto", () => {
  it("registra voto exitosamente sin alcanzar mayoria", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);
    votacionRepo.buscarPorId
      .mockResolvedValueOnce(crearVotacionDetalle())
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          votos: [{ idUsuario: "u1", decision: "aprobar" }],
          aprobaciones: 1,
          pendientes: 2,
        }),
      );

    const result = await emitirVoto(
      "v1",
      "u1",
      "aprobar",
      votacionRepo,
      miembroRepo,
    );

    expect(votacionRepo.registrarVoto).toHaveBeenCalledWith(
      "v1",
      "u1",
      "aprobar",
    );
    expect(result.estado).toBe("activa");
  });

  it("resuelve votacion si se alcanza mayoria de aprobaciones", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);
    votacionRepo.buscarPorId
      .mockResolvedValueOnce(crearVotacionDetalle())
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          votos: [
            { idUsuario: "u1", decision: "aprobar" },
            { idUsuario: "u2", decision: "aprobar" },
          ],
          aprobaciones: 2,
          pendientes: 1,
        }),
      )
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          estado: "resuelta",
          resultado: "aprobada",
          aprobaciones: 2,
          pendientes: 1,
        }),
      );

    const result = await emitirVoto(
      "v1",
      "u2",
      "aprobar",
      votacionRepo,
      miembroRepo,
    );

    expect(votacionRepo.resolver).toHaveBeenCalledWith("v1", "aprobada");
    expect(result.estado).toBe("resuelta");
    expect(result.resultado).toBe("aprobada");
  });

  it("resuelve votacion si se alcanza mayoria de rechazos", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);
    votacionRepo.buscarPorId
      .mockResolvedValueOnce(crearVotacionDetalle())
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          votos: [
            { idUsuario: "u1", decision: "rechazar" },
            { idUsuario: "u2", decision: "rechazar" },
          ],
          rechazos: 2,
          pendientes: 1,
        }),
      )
      .mockResolvedValueOnce(
        crearVotacionDetalle({
          estado: "resuelta",
          resultado: "rechazada",
          rechazos: 2,
          pendientes: 1,
        }),
      );

    const result = await emitirVoto(
      "v1",
      "u2",
      "rechazar",
      votacionRepo,
      miembroRepo,
    );

    expect(votacionRepo.resolver).toHaveBeenCalledWith("v1", "rechazada");
    expect(result.estado).toBe("resuelta");
    expect(result.resultado).toBe("rechazada");
  });

  it("lanza error si votacion no existe", async () => {
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      emitirVoto("no-existe", "u1", "aprobar", votacionRepo, {} as any),
    ).rejects.toThrow("Votación no encontrada");
  });

  it("lanza error si votacion ya esta resuelta", async () => {
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(
      crearVotacionDetalle({ estado: "resuelta" }),
    );

    await expect(
      emitirVoto("v1", "u1", "aprobar", votacionRepo, {} as any),
    ).rejects.toThrow("Esta votación ya fue resuelta");
  });

  it("lanza error si el usuario no es miembro del grupo", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(crearVotacionDetalle());
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await expect(
      emitirVoto("v1", "u1", "aprobar", votacionRepo, miembroRepo),
    ).rejects.toThrow("No eres miembro de este grupo");
  });

  it("lanza error si el usuario ya voto", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(
      crearVotacionDetalle({
        votos: [{ idUsuario: "u1", decision: "aprobar" }],
      }),
    );
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    await expect(
      emitirVoto("v1", "u1", "aprobar", votacionRepo, miembroRepo),
    ).rejects.toThrow("Ya emitiste tu voto en esta votación");
  });
});

describe("obtenerVotacionesGrupo", () => {
  it("retorna votaciones si es miembro", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);
    votacionRepo.buscarPorGrupo.mockResolvedValue([
      crearVotacionDetalle({ id: "v1" }),
    ]);

    const result = await obtenerVotacionesGrupo(
      "g1",
      "u1",
      votacionRepo,
      miembroRepo,
    );

    expect(result).toHaveLength(1);
  });

  it("lanza error si no es miembro", async () => {
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await expect(
      obtenerVotacionesGrupo("g1", "u1", {} as any, miembroRepo),
    ).rejects.toThrow("No eres miembro de este grupo");
  });
});

describe("obtenerVotacion", () => {
  it("retorna votacion si existe y es miembro", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(crearVotacionDetalle());
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    const result = await obtenerVotacion("v1", "u1", votacionRepo, miembroRepo);
    expect(result.id).toBe("v1");
  });

  it("lanza error si votacion no existe", async () => {
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      obtenerVotacion("no-existe", "u1", votacionRepo, {} as any),
    ).rejects.toThrow("Votación no encontrada");
  });

  it("lanza error si no es miembro del grupo", async () => {
    const miembroRepo = crearMockMiembroRepo();
    const votacionRepo = crearMockVotacionRepo();
    votacionRepo.buscarPorId.mockResolvedValue(
      crearVotacionDetalle({ idGrupo: "g1" }),
    );
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await expect(
      obtenerVotacion("v1", "u1", votacionRepo, miembroRepo),
    ).rejects.toThrow("No eres miembro de este grupo");
  });
});
