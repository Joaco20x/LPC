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

function crearNotificacionRepo() {
  return {
    obtenerPorUsuario: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
    crear: jest.fn(),
    crearMuchas: jest.fn(),
  };
}

function crearMiembroRepo() {
  return {
    buscarPorGrupo: jest.fn(),
    buscarPorUsuario: jest.fn(),
    crearMuchas: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("obtenerNotificaciones", () => {
  it("retorna notificaciones del usuario ordenadas", async () => {
    const notifRepo = crearNotificacionRepo();
    const mockNotifs = [
      {
        id: "n1",
        idUsuario: "u1",
        tipo: "nuevo_gasto",
        leida: false,
        creadoEn: new Date(),
      },
    ];
    notifRepo.obtenerPorUsuario.mockResolvedValue(mockNotifs);

    const result = await obtenerNotificaciones("u1", notifRepo);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("n1");
    expect(notifRepo.obtenerPorUsuario).toHaveBeenCalledWith("u1");
  });
});

describe("contarNoLeidas", () => {
  it("retorna 0 cuando no hay no leidas", async () => {
    const notifRepo = crearNotificacionRepo();
    notifRepo.contarNoLeidas.mockResolvedValue(0);

    const result = await contarNoLeidas("u1", notifRepo);
    expect(result).toBe(0);
  });

  it("retorna la cantidad de no leidas", async () => {
    const notifRepo = crearNotificacionRepo();
    notifRepo.contarNoLeidas.mockResolvedValue(3);

    const result = await contarNoLeidas("u1", notifRepo);
    expect(result).toBe(3);
  });
});

describe("marcarLeida", () => {
  it("marca una notificacion como leida exitosamente", async () => {
    const notifRepo = crearNotificacionRepo();

    await marcarLeida("n1", "u1", notifRepo);
    expect(notifRepo.marcarLeida).toHaveBeenCalledWith("n1", "u1");
  });
});

describe("marcarTodasLeidas", () => {
  it("marca todas las notificaciones como leidas exitosamente", async () => {
    const notifRepo = crearNotificacionRepo();

    await marcarTodasLeidas("u1", notifRepo);
    expect(notifRepo.marcarTodasLeidas).toHaveBeenCalledWith("u1");
  });
});

describe("notificarNuevoGasto", () => {
  it("notifica a todos los miembros excepto al pagador", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await notificarNuevoGasto(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        idPagador: "u1",
        nombrePagador: "Juan",
        descripcion: "Cena",
        monto: 15000,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledTimes(1);
    const llamada = notifRepo.crearMuchas.mock.calls[0][0];
    expect(llamada).toHaveLength(2);
    expect(llamada.map((n: any) => n.idUsuario)).toEqual(
      expect.arrayContaining(["u2", "u3"]),
    );
    expect(llamada[0].tipo).toBe("nuevo_gasto");
    expect(llamada[0].metadata).toEqual({
      idGrupo: "g1",
      nombreGrupo: "Grupo Test",
      descripcion: "Cena",
      monto: 15000,
      pagador: "Juan",
    });
  });

  it("no hace nada si no hay otros miembros", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([{ idUsuario: "u1" }]);

    await notificarNuevoGasto(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        idPagador: "u1",
        nombrePagador: "Juan",
        descripcion: "Cena",
        monto: 15000,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });
});

describe("notificarPresupuestoSuperado", () => {
  it("crea notificaciones cuando se supera el presupuesto", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        totalGastado: 10000,
        presupuestoPorPersona: 3000,
        totalMiembros: 2,
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalled();
    const llamada = notifRepo.crearMuchas.mock.calls[0][0];
    expect(llamada[0].tipo).toBe("presupuesto_superado");
    expect(llamada[0].metadata.presupuestoTotal).toBe(6000);
  });

  it("no crea notificaciones si el gasto no supera el presupuesto", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
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
  it("crea notificaciones para miembros existentes excepto el nuevo", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
      { idUsuario: "u3" },
    ]);

    await notificarIntegranteAnadido(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        nombreNuevoIntegrante: "Pedro",
        idNuevoIntegrante: "u3",
      },
      miembroRepo,
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledTimes(1);
    const ids = notifRepo.crearMuchas.mock.calls[0][0].map(
      (n: any) => n.idUsuario,
    );
    expect(ids).toEqual(expect.arrayContaining(["u1", "u2"]));
    expect(ids).not.toContain("u3");
  });

  it("no crea notificaciones si el nuevo integrante es el unico miembro", async () => {
    const notifRepo = crearNotificacionRepo();
    const miembroRepo = crearMiembroRepo();
    miembroRepo.buscarPorGrupo.mockResolvedValue([{ idUsuario: "u1" }]);

    await notificarIntegranteAnadido(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
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
  it("crea notificaciones para el miembro y admins cuando supera el umbral", async () => {
    const notifRepo = crearNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        presupuestoPorPersona: 10000,
        umbralAlerta: 80,
        miembrosInvolucrados: [
          { id: "u1", nombre: "Juan" },
          { id: "u2", nombre: "Ana" },
        ],
        gastoAcumuladoPorUsuario: { u1: 9000, u2: 7000 },
        idsAdmin: ["admin1", "u2"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).toHaveBeenCalledTimes(1);
    const llamada = notifRepo.crearMuchas.mock.calls[0][0];

    // u1 supera umbral (9000 > 8000) → notifica a u1 + admins (admin1, u2)
    // u2 no supera (7000 <= 8000) → no notifica
    const ids = llamada.map((n: any) => n.idUsuario);
    expect(ids).toContain("u1");
    expect(ids).toContain("admin1");
    expect(ids).toContain("u2"); // u2 es admin
    expect(ids.filter((id: string) => id === "u1")).toHaveLength(1);
    expect(llamada).toHaveLength(3);

    // Verificar metadata
    const notifJuan = llamada.find((n: any) => n.idUsuario === "u1");
    expect(notifJuan.tipo).toBe("presupuesto_superado");
    expect(notifJuan.metadata).toEqual({
      idGrupo: "g1",
      nombreGrupo: "Grupo Test",
      nombreIntegrante: "Juan",
      gastoAcumulado: 9000,
      presupuestoPorPersona: 10000,
      porcentajeUsado: 90,
    });
  });

  it("no crea notificaciones si ningun miembro supera el umbral", async () => {
    const notifRepo = crearNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        presupuestoPorPersona: 10000,
        umbralAlerta: 80,
        miembrosInvolucrados: [
          { id: "u1", nombre: "Juan" },
          { id: "u2", nombre: "Ana" },
        ],
        gastoAcumuladoPorUsuario: { u1: 5000, u2: 7000 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });

  it("no crea notificaciones si presupuestoPorPersona es 0", async () => {
    const notifRepo = crearNotificacionRepo();

    await notificarPresupuestoSuperado(
      {
        idGrupo: "g1",
        nombreGrupo: "Grupo Test",
        presupuestoPorPersona: 0,
        miembrosInvolucrados: [{ id: "u1", nombre: "Juan" }],
        gastoAcumuladoPorUsuario: { u1: 100 },
        idsAdmin: ["admin1"],
      },
      notifRepo,
    );

    expect(notifRepo.crearMuchas).not.toHaveBeenCalled();
  });
});

describe("notificarPagoDeuda", () => {
  it("crea notificacion para el acreedor con datos de pago", async () => {
    const notifRepo = crearNotificacionRepo();

    await notificarPagoDeuda(
      {
        idAcreedor: "u1",
        nombreDeudor: "Juan",
        nombreGrupo: "Grupo Test",
        monto: 5000,
      },
      notifRepo,
    );

    expect(notifRepo.crear).toHaveBeenCalledWith({
      idUsuario: "u1",
      tipo: "pago_deuda",
      metadata: {
        nombreDeudor: "Juan",
        nombreGrupo: "Grupo Test",
        monto: 5000,
      },
    });
  });
});
