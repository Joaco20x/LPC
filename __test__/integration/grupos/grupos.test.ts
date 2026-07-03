import {
  crearGrupoViaje,
  obtenerGruposDelUsuario,
  obtenerDetalleGrupo,
  actualizarPresupuestoGrupo,
} from "@/grupos/services/grupos.service";

function crearMocks() {
  const usuarioRepo = {
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmails: jest.fn(),
    buscarPorOauth: jest.fn(),
    crear: jest.fn(),
    actualizarContrasena: jest.fn(),
  };
  const grupoRepo = {
    crear: jest.fn(),
    obtenerDetalle: jest.fn(),
    actualizarPresupuesto: jest.fn(),
  };
  const miembroRepo = {
    buscarPorGrupo: jest.fn(),
    crearMuchas: jest.fn(),
    buscarPorUsuario: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
  const deudaRepo = {
    obtenerTodasPorGrupoIncluyendoSaldadas: jest.fn(),
    obtenerTodasPorGrupo: jest.fn(),
    crearMuchas: jest.fn(),
    obtenerPendientes: jest.fn(),
    marcarComoSaldadas: jest.fn(),
  };
  const db = { transaction: jest.fn((fn: any) => fn({})) };
  return { usuarioRepo, grupoRepo, miembroRepo, deudaRepo, db };
}

describe("crearGrupoViaje", () => {
  it("crea grupo y miembros en una transacción", async () => {
    const { usuarioRepo, grupoRepo, miembroRepo, db } = crearMocks();
    usuarioRepo.buscarPorEmails.mockResolvedValue([
      { id: "user-2", nombre: "Invitado", correo: "invitado@test.com" },
    ]);
    grupoRepo.crear.mockResolvedValue({ id: "grupo-1" });

    await crearGrupoViaje(
      {
        nombre: "Viaje",
        pais: "Chile",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-07-10",
        idCreador: "user-1",
        correosIntegrantes: ["invitado@test.com"],
      },
      usuarioRepo,
      grupoRepo,
      miembroRepo,
      db,
    );

    expect(grupoRepo.crear).toHaveBeenCalled();
    expect(miembroRepo.crearMuchas).toHaveBeenCalled();
    const miembros = miembroRepo.crearMuchas.mock.calls[0][0];
    expect(miembros).toHaveLength(2); // admin + invitado
    expect(miembros[0]).toMatchObject({ idUsuario: "user-1", rol: "admin" });
    expect(miembros[1]).toMatchObject({ idUsuario: "user-2", rol: "miembro" });
  });

  it("lanza error si hay correos no registrados", async () => {
    const { usuarioRepo, grupoRepo, miembroRepo, db } = crearMocks();
    usuarioRepo.buscarPorEmails.mockResolvedValue([]);

    await expect(
      crearGrupoViaje(
        {
          nombre: "Viaje",
          pais: "Chile",
          fechaInicio: "2026-07-01",
          fechaFin: "2026-07-10",
          idCreador: "user-1",
          correosIntegrantes: ["no-existe@test.com"],
        },
        usuarioRepo,
        grupoRepo,
        miembroRepo,
        db,
      ),
    ).rejects.toThrow(
      "Uno o más correos ingresados no corresponden a usuarios registrados",
    );
  });
});

describe("obtenerGruposDelUsuario", () => {
  it("retorna grupos formateados con conteo de miembros", async () => {
    const { miembroRepo } = crearMocks();
    miembroRepo.buscarPorUsuario.mockResolvedValue([
      {
        rol: "admin",
        grupo: {
          id: "g1",
          nombre: "Viaje Chile",
          destino: "Chile",
          fechaInicio: new Date("2026-07-01"),
          fechaFin: new Date("2026-07-10"),
          monedaBase: "CLP",
          _count: { miembros: 3 },
        },
      } as any,
    ]);

    const grupos = await obtenerGruposDelUsuario("user-1", miembroRepo);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].totalMiembros).toBe(3);
    expect(grupos[0].rol).toBe("admin");
  });
});

describe("obtenerDetalleGrupo", () => {
  it("retorna detalle del grupo si existe", async () => {
    const { grupoRepo, deudaRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      nombre: "Viaje",
      monedaBase: "CLP",
      gastos: [],
    } as any);
    deudaRepo.obtenerTodasPorGrupoIncluyendoSaldadas.mockResolvedValue([]);

    const grupo = await obtenerDetalleGrupo("g1", grupoRepo, deudaRepo);
    expect(grupo.id).toBe("g1");
    expect(grupo.deudas).toEqual([]);
  });

  it("lanza error si el grupo no existe", async () => {
    const { grupoRepo, deudaRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      obtenerDetalleGrupo("no-existe", grupoRepo, deudaRepo),
    ).rejects.toThrow("Grupo no encontrado");
  });
});

describe("actualizarPresupuestoGrupo", () => {
  it("lanza error si el grupo no existe", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      actualizarPresupuestoGrupo(
        "no-existe",
        "user-1",
        { presupuestoPorPersona: 50000, umbralAlerta: 80 },
        grupoRepo,
      ),
    ).rejects.toThrow("Grupo no encontrado");
  });

  it("lanza error si el usuario no es admin", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [
        { usuario: { id: "user-1" }, rol: "miembro" },
        { usuario: { id: "user-2" }, rol: "admin" },
      ],
    } as any);

    await expect(
      actualizarPresupuestoGrupo(
        "g1",
        "user-1",
        { presupuestoPorPersona: 50000, umbralAlerta: 80 },
        grupoRepo,
      ),
    ).rejects.toThrow(
      "Solo el administrador del grupo puede modificar el presupuesto",
    );
  });

  it("lanza error si presupuestoPorPersona es menor o igual a 0", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-1" }, rol: "admin" }],
    } as any);

    await expect(
      actualizarPresupuestoGrupo(
        "g1",
        "user-1",
        { presupuestoPorPersona: 0, umbralAlerta: null },
        grupoRepo,
      ),
    ).rejects.toThrow("El presupuesto por persona debe ser un valor positivo");

    await expect(
      actualizarPresupuestoGrupo(
        "g1",
        "user-1",
        { presupuestoPorPersona: -10, umbralAlerta: null },
        grupoRepo,
      ),
    ).rejects.toThrow("El presupuesto por persona debe ser un valor positivo");
  });

  it("lanza error si umbralAlerta esta fuera del rango 1-100", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-1" }, rol: "admin" }],
    } as any);

    await expect(
      actualizarPresupuestoGrupo(
        "g1",
        "user-1",
        { presupuestoPorPersona: null, umbralAlerta: 0 },
        grupoRepo,
      ),
    ).rejects.toThrow("El umbral de alerta debe estar entre 1 y 100");

    await expect(
      actualizarPresupuestoGrupo(
        "g1",
        "user-1",
        { presupuestoPorPersona: null, umbralAlerta: 101 },
        grupoRepo,
      ),
    ).rejects.toThrow("El umbral de alerta debe estar entre 1 y 100");
  });

  it("actualiza correctamente con valores validos", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-1" }, rol: "admin" }],
    } as any);

    const resultado = await actualizarPresupuestoGrupo(
      "g1",
      "user-1",
      { presupuestoPorPersona: 50000, umbralAlerta: 80 },
      grupoRepo,
    );

    expect(grupoRepo.actualizarPresupuesto).toHaveBeenCalledWith("g1", {
      presupuestoPorPersona: 50000,
      umbralAlerta: 80,
    });
    expect(resultado).toEqual({
      presupuestoPorPersona: 50000,
      umbralAlerta: 80,
    });
  });

  it("actualiza con valores null permitidos", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      miembros: [{ usuario: { id: "user-1" }, rol: "admin" }],
    } as any);

    const resultado = await actualizarPresupuestoGrupo(
      "g1",
      "user-1",
      { presupuestoPorPersona: null, umbralAlerta: null },
      grupoRepo,
    );

    expect(grupoRepo.actualizarPresupuesto).toHaveBeenCalledWith("g1", {
      presupuestoPorPersona: null,
      umbralAlerta: null,
    });
    expect(resultado).toEqual({
      presupuestoPorPersona: null,
      umbralAlerta: null,
    });
  });
});
