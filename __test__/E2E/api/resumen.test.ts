import { controladorCronResumen } from "@/resumen/controllers/cron.controller";
import { controladorObtenerResumenesPorGrupo } from "@/resumen/controllers/resumen.controller";
import { crearMockNextRequest } from "../helpers";

const mockGrupoRepo = {
  obtenerTodosActivos: jest.fn(),
  obtenerDetalle: jest.fn(),
};
const mockGastoRepo = {
  obtenerPorGrupoYRangoFecha: jest.fn(),
};
const mockResumenRepo = {
  crear: jest.fn(),
  obtenerPorGrupoYMes: jest.fn(),
  obtenerHistorialPorGrupo: jest.fn(),
};
const mockNotificacionRepo = {
  crearMuchas: jest.fn(),
};
const mockMiembroRepo = {
  buscarPorGrupo: jest.fn(),
};

jest.mock("@/auth/services/jwt", () => ({
  verificarAccessToken: jest.fn(),
}));
jest.mock("@/grupos/repositories/PrismaGrupoRepository", () => ({
  PrismaGrupoRepository: jest.fn(() => mockGrupoRepo),
}));
jest.mock("@/gastos/repositories/PrismaGastoRepository", () => ({
  PrismaGastoRepository: jest.fn(() => mockGastoRepo),
}));
jest.mock("@/resumen/repositories/PrismaResumenRepository", () => ({
  PrismaResumenRepository: jest.fn(() => mockResumenRepo),
}));
jest.mock("@/notificaciones/repositories/PrismaNotificacionRepository", () => ({
  PrismaNotificacionRepository: jest.fn(() => mockNotificacionRepo),
}));
jest.mock("@/grupos/repositories/PrismaMiembroGrupoRepository", () => ({
  PrismaMiembroGrupoRepository: jest.fn(() => mockMiembroRepo),
}));
jest.mock("@/resumen/services/cronResumen.service", () => ({
  generarResumenesMensuales: jest.fn(),
}));

const CRON_SECRET_ORIGINAL = process.env.CRON_SECRET;

afterAll(() => {
  if (CRON_SECRET_ORIGINAL === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = CRON_SECRET_ORIGINAL;
  }
});

describe("controladorCronResumen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 200 cuando CRON_SECRET no está definido", async () => {
    delete process.env.CRON_SECRET;
    const {
      generarResumenesMensuales,
    } = require("@/resumen/services/cronResumen.service");
    generarResumenesMensuales.mockResolvedValue({
      generados: 2,
      periodo: { mes: 6, anio: 2026 },
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/cron/resumen",
    });
    const respuesta = await controladorCronResumen(req);
    const body = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(body.exito).toBe(true);
    expect(body.datos.generados).toBe(2);
  });

  it("retorna 200 con CRON_SECRET válido", async () => {
    process.env.CRON_SECRET = "mi-secreto-cron";
    const {
      generarResumenesMensuales,
    } = require("@/resumen/services/cronResumen.service");
    generarResumenesMensuales.mockResolvedValue({
      generados: 1,
      periodo: { mes: 6, anio: 2026 },
    });

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/cron/resumen",
      token: "mi-secreto-cron",
    });
    const respuesta = await controladorCronResumen(req);
    const body = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(body.exito).toBe(true);
  });

  it("retorna 401 con CRON_SECRET inválido", async () => {
    process.env.CRON_SECRET = "mi-secreto-cron";

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/cron/resumen",
      token: "otro-token",
    });
    const respuesta = await controladorCronResumen(req);
    const body = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(body.exito).toBe(false);
    expect(body.mensaje).toBe("No autorizado");
  });

  it("retorna 500 cuando el servicio lanza error", async () => {
    delete process.env.CRON_SECRET;
    const {
      generarResumenesMensuales,
    } = require("@/resumen/services/cronResumen.service");
    generarResumenesMensuales.mockRejectedValue(new Error("Error interno"));

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/cron/resumen",
    });
    const respuesta = await controladorCronResumen(req);
    const body = await respuesta.json();

    expect(respuesta.status).toBe(500);
    expect(body.exito).toBe(false);
  });
});

describe("controladorObtenerResumenesPorGrupo", () => {
  const { verificarAccessToken } = jest.requireMock("@/auth/services/jwt");
  const tokenValido = "token-valido";

  beforeEach(() => {
    jest.clearAllMocks();
    verificarAccessToken.mockReturnValue({ idUsuario: "u1" });
    mockMiembroRepo.buscarPorGrupo.mockResolvedValue([
      { idUsuario: "u1" },
      { idUsuario: "u2" },
    ]);
  });

  it("retorna 200 para grupo existente con resúmenes", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue({
      id: "g1",
      nombre: "Viaje Chile",
    });
    mockResumenRepo.obtenerHistorialPorGrupo.mockResolvedValue([
      { id: "r1", mes: 5, anio: 2026, totalGastos: 500 },
      { id: "r2", mes: 6, anio: 2026, totalGastos: 300 },
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumenes",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenesPorGrupo(req, {
      id: "g1",
    });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(body.exito).toBe(true);
    expect(body.datos).toHaveLength(2);
  });

  it("retorna 404 para grupo inexistente", async () => {
    mockGrupoRepo.obtenerDetalle.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/no-existe/resumenes",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenesPorGrupo(req, {
      id: "no-existe",
    });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(404);
    expect(body.exito).toBe(false);
    expect(body.mensaje).toBe("Grupo no encontrado");
  });

  it("retorna 500 cuando el repositorio falla", async () => {
    mockGrupoRepo.obtenerDetalle.mockRejectedValue(new Error("Error de BD"));

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/grupos/g1/resumenes",
      token: tokenValido,
    });
    const respuesta = await controladorObtenerResumenesPorGrupo(req, {
      id: "g1",
    });
    const body = await respuesta.json();

    expect(respuesta.status).toBe(500);
    expect(body.exito).toBe(false);
  });
});
