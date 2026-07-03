import {
  crearInvitacion,
  aceptarInvitacion,
  obtenerInvitacionesGrupo,
  verificarTokenInvitacion,
} from "@/invitaciones/services/invitacion.service";

function crearMockGrupoRepo() {
  return {
    crear: jest.fn(),
    obtenerDetalle: jest.fn(),
    actualizarPresupuesto: jest.fn(),
    obtenerTodosActivos: jest.fn(),
  };
}

function crearMockInvitacionRepo() {
  return {
    crear: jest.fn(),
    buscarPorToken: jest.fn(),
    buscarPorGrupo: jest.fn(),
    marcarComoUsada: jest.fn(),
    invalidarPorGrupoYCorreo: jest.fn(),
  };
}

function crearMockMiembroRepo() {
  return {
    buscarPorGrupo: jest.fn(),
    buscarPorUsuario: jest.fn(),
    crearMuchas: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
}

function crearGrupoDetalle(adminId: string) {
  return {
    id: "g1",
    nombre: "Grupo Test",
    destino: "Chile",
    fechaInicio: new Date(),
    fechaFin: new Date(),
    monedaBase: "CLP",
    presupuestoPorPersona: null,
    umbralAlerta: null,
    estado: "activo",
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    miembros: [
      {
        idUsuario: adminId,
        rol: "admin",
        usuario: { id: adminId, nombre: "Admin", correo: "admin@test.com" },
      },
      {
        idUsuario: "user-2",
        rol: "miembro",
        usuario: {
          id: "user-2",
          nombre: "User 2",
          correo: "user2@test.com",
        },
      },
    ],
    gastos: [],
    _count: { miembros: 2 },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("crearInvitacion", () => {
  it("crea invitacion tipo enlace exitosamente", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle("admin-id"));
    invitacionRepo.crear.mockResolvedValue({ id: "inv-1", token: "tok-1" });

    const result = await crearInvitacion(
      {
        idGrupo: "g1",
        idInvitador: "admin-id",
        tipo: "enlace",
        expiraHoras: 24,
      },
      invitacionRepo,
      grupoRepo,
    );

    expect(result.token).toBeDefined();
    expect(result.enlace).toContain("/invitar/");
    expect(invitacionRepo.crear).toHaveBeenCalled();
  });

  it("lanza error si el grupo no existe", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      crearInvitacion(
        {
          idGrupo: "g1",
          idInvitador: "admin-id",
          tipo: "enlace",
          expiraHoras: 24,
        },
        invitacionRepo,
        grupoRepo,
      ),
    ).rejects.toThrow("Grupo no encontrado");
  });

  it("lanza error si el invitador no es admin", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle("admin-id"));

    await expect(
      crearInvitacion(
        {
          idGrupo: "g1",
          idInvitador: "user-2",
          tipo: "enlace",
          expiraHoras: 24,
        },
        invitacionRepo,
        grupoRepo,
      ),
    ).rejects.toThrow("Solo los administradores pueden crear invitaciones");
  });

  it("invalida invitaciones previas para invitacion tipo correo", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle("admin-id"));
    invitacionRepo.crear.mockResolvedValue({ id: "inv-1", token: "tok-1" });

    await crearInvitacion(
      {
        idGrupo: "g1",
        idInvitador: "admin-id",
        tipo: "correo",
        correoInvitado: "invitado@test.com",
        expiraHoras: 24,
      },
      invitacionRepo,
      grupoRepo,
    );

    expect(invitacionRepo.invalidarPorGrupoYCorreo).toHaveBeenCalledWith(
      "g1",
      "invitado@test.com",
    );
  });
});

describe("aceptarInvitacion", () => {
  it("acepta invitacion y agrega al usuario como miembro", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      token: "tok-1",
      estado: "pendiente",
    });
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "user-1" },
      { idUsuario: "admin-id" },
    ]);

    const result = await aceptarInvitacion(
      "tok-1",
      "new-user",
      invitacionRepo,
      miembroRepo,
    );

    expect(result.idGrupo).toBe("g1");
    expect(miembroRepo.crearMuchas).toHaveBeenCalledWith([
      { idGrupo: "g1", idUsuario: "new-user", rol: "miembro" },
    ]);
    expect(invitacionRepo.marcarComoUsada).toHaveBeenCalledWith("tok-1");
  });

  it("lanza error si invitacion no existe", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue(null);

    await expect(
      aceptarInvitacion("no-existe", "u1", invitacionRepo, {} as any),
    ).rejects.toThrow("Invitación no encontrada");
  });

  it("lanza error si invitacion esta expirada", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      estado: "expirada",
    });

    await expect(
      aceptarInvitacion("tok-1", "u1", invitacionRepo, {} as any),
    ).rejects.toThrow("La invitación ha expirado");
  });

  it("lanza error si invitacion ya fue utilizada", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      estado: "aceptada",
    });

    await expect(
      aceptarInvitacion("tok-1", "u1", invitacionRepo, {} as any),
    ).rejects.toThrow("Esta invitación ya fue utilizada");
  });

  it("lanza error si el usuario ya es miembro del grupo", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    const miembroRepo = crearMockMiembroRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      estado: "pendiente",
    });
    miembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    await expect(
      aceptarInvitacion("tok-1", "u1", invitacionRepo, miembroRepo),
    ).rejects.toThrow("Ya eres miembro de este grupo");
  });
});

describe("obtenerInvitacionesGrupo", () => {
  it("retorna invitaciones si el usuario es admin", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle("admin-id"));
    invitacionRepo.buscarPorGrupo.mockResolvedValue([
      { id: "inv-1", token: "t1", estado: "pendiente" },
    ]);

    const result = await obtenerInvitacionesGrupo(
      "g1",
      "admin-id",
      invitacionRepo,
      grupoRepo,
    );

    expect(result).toHaveLength(1);
  });

  it("lanza error si no es admin", async () => {
    const grupoRepo = crearMockGrupoRepo();
    grupoRepo.obtenerDetalle.mockResolvedValue(crearGrupoDetalle("admin-id"));

    await expect(
      obtenerInvitacionesGrupo("g1", "user-2", {} as any, grupoRepo),
    ).rejects.toThrow("Solo los administradores pueden ver las invitaciones");
  });
});

describe("verificarTokenInvitacion", () => {
  it("retorna datos de invitacion valida", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
      token: "tok-1",
      estado: "pendiente",
    });
    grupoRepo.obtenerDetalle.mockResolvedValue({
      nombre: "Grupo Test",
      destino: "Chile",
    });

    const result = await verificarTokenInvitacion(
      "tok-1",
      invitacionRepo,
      grupoRepo,
    );

    expect(result.nombreGrupo).toBe("Grupo Test");
    expect(result.destino).toBe("Chile");
  });

  it("lanza error si token no existe", async () => {
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue(null);

    await expect(
      verificarTokenInvitacion("no-existe", invitacionRepo, {} as any),
    ).rejects.toThrow("Invitación no encontrada");
  });

  it("lanza error si el grupo asociado ya no existe", async () => {
    const grupoRepo = crearMockGrupoRepo();
    const invitacionRepo = crearMockInvitacionRepo();
    invitacionRepo.buscarPorToken.mockResolvedValue({
      id: "inv-1",
      idGrupo: "g1",
    });
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(
      verificarTokenInvitacion("tok-1", invitacionRepo, grupoRepo),
    ).rejects.toThrow("El grupo asociado ya no existe");
  });
});
