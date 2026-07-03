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

describe("notificarPresupuestoSuperado — nuevo path (por persona)", () => {
  it("notifica al miembro que supera el umbral y a los admins", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        umbralAlerta: 80,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 9000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ idUsuario: "u1" }),
        expect.objectContaining({ idUsuario: "admin1" }),
      ]),
    );
    expect(notifRepo.crearMuchas).toHaveBeenCalledTimes(1);
  });

  it("no notifica si el gasto acumulado no supera el umbral", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        umbralAlerta: 80,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 5000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("notifica a múltiples miembros que superan el umbral", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        miembrosInvolucrados: [
          { id: "u1", nombre: "Juan" },
          { id: "u2", nombre: "Ana" },
          { id: "u3", nombre: "Luis" },
        ],
        gastoAcumuladoPorUsuario: { u1: 11000, u2: 5000, u3: 12000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    const idsNotificados = notifRepo.crearMuchas.mock.calls[0][0].map(
      (n: any) => n.idUsuario,
    );
    expect(idsNotificados).toContain("u1");
    expect(idsNotificados).toContain("u3");
    expect(idsNotificados).not.toContain("u2");
  });

  it("no duplica notificación si el admin es el mismo miembro", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        miembrosInvolucrados: [{ id: "admin1", nombre: "Admin" }],
        gastoAcumuladoPorUsuario: { admin1: 15000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas.mock.calls[0][0]).toHaveLength(1);
  });

  it("retorna temprano si presupuestoPorPersona <= 0", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 0,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 100 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("no hace nada si miembrosInvolucrados está vacío", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        miembrosInvolucrados: [],
        gastoAcumuladoPorUsuario: {},
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("usa umbral 100% por defecto si no se provee umbralAlerta", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 10000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalled();
  });

  it("no notifica si el miembro no tiene gasto acumulado registrado", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: {},
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("incluye metadata correcta en la notificación", async () => {
    const notifRepo = crearMockNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Viaje",
        presupuestoPorPersona: 10000,
        umbralAlerta: 80,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 8500 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    const llamada = notifRepo.crearMuchas.mock.calls[0][0];
    const notifMiembro = llamada.find((n: any) => n.idUsuario === "u1");
    expect(notifMiembro.tipo).toBe("presupuesto_superado");
    expect(notifMiembro.metadata).toEqual({
      idGrupo: "g1",
      nombreGrupo: "Viaje",
      nombreIntegrante: "Juan",
      gastoAcumulado: 8500,
      presupuestoPorPersona: 10000,
      porcentajeUsado: 85,
    });
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
