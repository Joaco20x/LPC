import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  notificarNuevoGasto,
  notificarPresupuestoSuperado,
  notificarIntegranteAnadido,
  notificarPagoDeuda,
} from "@/notificaciones/services/notificacion.service";

function crearMockNotificacionRepo() {
  return {
    obtenerPorUsuario: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    crear: jest.fn(),
    crearMuchas: jest.fn(),
  };
}

function crearMockMiembroRepo() {
  return {
    buscarPorGrupo: jest.fn(),
    buscarPorUsuario: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("obtenerNotificaciones", () => {
  it("retorna notificaciones del usuario", async () => {
    const repo = crearMockNotificacionRepo();
    const esperado = [{ id: "n1", tipo: "nuevo_gasto" }];
    repo.obtenerPorUsuario.mockResolvedValue(esperado);

    const result = await obtenerNotificaciones("u1", repo);
    expect(result).toEqual(esperado);
    expect(repo.obtenerPorUsuario).toHaveBeenCalledWith("u1");
  });
});

describe("contarNoLeidas", () => {
  it("retorna cantidad de no leidas", async () => {
    const repo = crearMockNotificacionRepo();
    repo.contarNoLeidas.mockResolvedValue(3);

    const result = await contarNoLeidas("u1", repo);
    expect(result).toBe(3);
    expect(repo.contarNoLeidas).toHaveBeenCalledWith("u1");
  });
});

describe("marcarLeida", () => {
  it("marca una notificacion como leida", async () => {
    const repo = crearMockNotificacionRepo();

    await marcarLeida("n1", "u1", repo);
    expect(repo.marcarLeida).toHaveBeenCalledWith("n1", "u1");
  });
});

describe("marcarTodasLeidas", () => {
  it("marca todas las notificaciones como leidas", async () => {
    const repo = crearMockNotificacionRepo();

    await marcarTodasLeidas("u1", repo);
    expect(repo.marcarTodasLeidas).toHaveBeenCalledWith("u1");
  });
});

describe("notificarNuevoGasto", () => {
  it("crea notificaciones para miembros excepto el pagador", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await notificarNuevoGasto(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        idPagador: "u1",
        nombrePagador: "Juan",
        descripcion: "Cena",
        monto: 5000,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ idUsuario: "u2" }),
        expect.objectContaining({ idUsuario: "u3" }),
      ]),
    );
    expect(notifRepo.crearMuchas).toHaveBeenCalledTimes(1);
  });

  it("no crea notificaciones si solo hay un miembro (el pagador)", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([{ idUsuario: "u1" }]);

    await notificarNuevoGasto(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        idPagador: "u1",
        nombrePagador: "Juan",
        descripcion: "Cena",
        monto: 5000,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });
});

describe("notificarPresupuestoSuperado", () => {
  it("crea notificaciones cuando el gasto supera el presupuesto total", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        totalGastado: 10000,
        presupuestoPorPersona: 3000,
        totalMiembros: 2,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalled();
  });

  it("no crea notificaciones si no se supera el presupuesto total", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        totalGastado: 5000,
        presupuestoPorPersona: 3000,
        totalMiembros: 2,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });
});

describe("notificarIntegranteAnadido", () => {
  it("crea notificaciones para miembros excepto el nuevo integrante", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await notificarIntegranteAnadido(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        nombreNuevoIntegrante: "Pedro",
        idNuevoIntegrante: "u3",
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ idUsuario: "u1" }),
        expect.objectContaining({ idUsuario: "u2" }),
      ]),
    );
  });

  it("no crea notificaciones si el nuevo integrante es el unico miembro", async () => {
    const notifRepo = crearMockNotificacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([{ idUsuario: "u1" }]);

    await notificarIntegranteAnadido(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        nombreNuevoIntegrante: "Pedro",
        idNuevoIntegrante: "u1",
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });
});

describe("notificarPagoDeuda", () => {
  it("crea una notificacion para el acreedor", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPagoDeuda(
      {
        idAcreedor: "u1",
        nombreDeudor: "Juan",
        nombreGrupo: "Viaje",
        monto: 5000,
      },
      notifRepo,
    );

    expect(notifRepo.crear).toHaveBeenCalledWith({
      idUsuario: "u1",
      tipo: "pago_deuda",
      metadata: { nombreDeudor: "Juan", nombreGrupo: "Viaje", monto: 5000 },
    });
  });
});
