import {
  crearGrupoViaje,
  obtenerGruposDelUsuario,
  obtenerDetalleGrupo,
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
  const grupoRepo = { crear: jest.fn(), obtenerDetalle: jest.fn() };
  const miembroRepo = {
    buscarPorGrupo: jest.fn(),
    crearMuchas: jest.fn(),
    buscarPorUsuario: jest.fn(),
    buscarMiembrosDeGrupos: jest.fn(),
  };
  const db = { transaction: jest.fn((fn: any) => fn({})) };
  return { usuarioRepo, grupoRepo, miembroRepo, db };
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
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue({ id: "g1", nombre: "Viaje" });

    const grupo = await obtenerDetalleGrupo("g1", grupoRepo);
    expect(grupo.id).toBe("g1");
  });

  it("lanza error si el grupo no existe", async () => {
    const { grupoRepo } = crearMocks();
    grupoRepo.obtenerDetalle.mockResolvedValue(null);

    await expect(obtenerDetalleGrupo("no-existe", grupoRepo)).rejects.toThrow(
      "Grupo no encontrado",
    );
  });
});
