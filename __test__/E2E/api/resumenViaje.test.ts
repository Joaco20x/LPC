import { controladorObtenerResumenViaje } from "@/resumen/controllers/resumenViaje.controller";
import { crearMockNextRequest } from "../helpers";

const mockGrupoRepo = {
  obtenerDetalle: jest.fn(),
  obtenerTodosActivos: jest.fn(),
};

const mockMiembroRepo = {
  buscarPorGrupo: jest.fn(),
};

const mockGastoRepo = {
  obtenerPorGrupoYRangoFecha: jest.fn(),
  obtenerPorGrupo: jest.fn(),
};

const mockDeudaRepo = {
  obtenerTodasPorGrupo: jest.fn(),
};

jest.mock("@/auth/services/jwt", () => ({
  verificarAccessToken: jest.fn(),
}));

jest.mock("@/grupos/repositories/PrismaGrupoRepository", () => ({
  PrismaGrupoRepository: jest.fn(() => mockGrupoRepo),
}));

jest.mock("@/grupos/repositories/PrismaMiembroGrupoRepository", () => ({
  PrismaMiembroGrupoRepository: jest.fn(() => mockMiembroRepo),
}));

jest.mock("@/gastos/repositories/PrismaGastoRepository", () => ({
  PrismaGastoRepository: jest.fn(() => mockGastoRepo),
}));

jest.mock("@/deudas/repositories/PrismaDeudaRepository", () => ({
  PrismaDeudaRepository: jest.fn(() => mockDeudaRepo),
}));

jest.mock("@/resumen/services/estadisticas.service", () => ({
  calcularEstadisticasRango: jest.fn(),
}));

const { verificarAccessToken } = jest.requireMock("@/auth/services/jwt");
const tokenValido = "token-valido";
const grupoValido = {
  id: "g1",
  nombre: "Viaje Test",
  destino: "Destino Test",
  fechaInicio: new Date("2026-07-01"),
  fechaFin: new Date("2026-07-05"),
  monedaBase: "CLP",
  miembros: [],
  gastos: [],
  presupuestoPorPersona: null,
  umbralAlerta: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  estado: "activo",
};

describe("controladorObtenerResumenViaje", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verificarAccessToken.mockReturnValue({ idUsuario: "u1" });
  });

  it("retorna 200 con datos de resumen", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue(grupoValido);
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);

    const { calcularEstadisticasRango } = jest.requireMock(
      "@/resumen/services/estadisticas.service",
    );
    calcularEstadisticasRango.mockResolvedValue({
      totalGastos: 200000,
      porCategoria: { Comida: 200000 },
      porIntegrante: {
        u1: {
          id: "u1",
          nombre: "Alice",
          gastado: 200000,
          asignado: 100000,
          saldo: 100000,
        },
        u2: {
          id: "u2",
          nombre: "Bob",
          gastado: 0,
          asignado: 100000,
          saldo: -100000,
        },
      },
    });

    mockGastoRepo.obtenerPorGrupoYRangoFecha.mockResolvedValue([
      { id: "gasto1" },
    ]);

    mockDeudaRepo.obtenerTodasPorGrupo.mockResolvedValue([
      {
        idDeudor: "u2",
        idAcreedor: "u1",
        monto: 100000,
        moneda: "CLP",
        deudor: { nombre: "Bob" },
        acreedor: { nombre: "Alice" },
      },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumen-viaje",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenViaje(req, { id: "g1" });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(body.exito).toBe(true);
    expect(body.datos.resumenGeneral.totalGastos).toBe(200000);
    expect(body.datos.porCategoria).toHaveLength(1);
    expect(body.datos.porIntegrante).toHaveLength(2);
    expect(body.datos.deudas).toHaveLength(1);
    expect(body.datos.ranking.mayorGasto.nombre).toBe("Alice");
  });

  it("retorna 401 sin token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumen-viaje",
    });
    const respuesta = await controladorObtenerResumenViaje(req, { id: "g1" });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(body.exito).toBe(false);
    expect(body.mensaje).toBe("No autorizado");
  });

  it("retorna 401 con token invalido", async () => {
    verificarAccessToken.mockImplementation(() => {
      throw new Error("Token inválido");
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumen-viaje",
      token: "token-manipulado",
    });
    const respuesta = await controladorObtenerResumenViaje(req, { id: "g1" });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(body.exito).toBe(false);
  });

  it("retorna 404 si el grupo no existe", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/no-existe/resumen-viaje",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenViaje(req, {
      id: "no-existe",
    });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(404);
    expect(body.exito).toBe(false);
    expect(body.mensaje).toBe("Grupo no encontrado");
  });

  it("retorna 403 si el usuario no es miembro del grupo", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue(grupoValido);
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "otro-usuario" },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumen-viaje",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenViaje(req, { id: "g1" });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(403);
    expect(body.exito).toBe(false);
    expect(body.mensaje).toBe("No perteneces a este grupo");
  });

  it("retorna 500 si el repositorio falla", async () => {
    mockGrupoRepo.obtenerDetalle.mockRejectedValue(new Error("Error de BD"));

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumen-viaje",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenViaje(req, { id: "g1" });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(500);
    expect(body.exito).toBe(false);
  });
});
