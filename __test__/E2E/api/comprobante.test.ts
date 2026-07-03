import { controladorObtenerDeuda } from "@/deudas/controllers/deudas.controller";
import {
  controladorSubirComprobante,
  controladorObtenerComprobantes,
  controladorAceptarComprobante,
  controladorRechazarComprobante,
} from "@/deudas/controllers/comprobante.controller";
import { crearMockNextRequest } from "../helpers";

jest.mock("@/auth/services/jwt", () => ({
  verificarAccessToken: jest.fn(),
}));

jest.mock("node:fs/promises", () => ({
  writeFile: jest.fn(),
}));

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "uuid-fijo"),
}));

const mockComprobanteRepo = {
  crear: jest.fn(),
  obtenerPorDeuda: jest.fn(),
  obtenerPorId: jest.fn(),
  actualizarEstado: jest.fn(),
};

const mockDeudaRepo = {
  crearMuchas: jest.fn(),
  obtenerPendientes: jest.fn(),
  obtenerTodasPorGrupo: jest.fn(),
  marcarComoSaldadas: jest.fn(),
  obtenerPorId: jest.fn(),
  actualizarEstado: jest.fn(),
};

jest.mock("@/shared/di/crearDependencias", () => ({
  crearDependencias: jest.fn(() => ({
    comprobanteRepo: mockComprobanteRepo,
    deudaRepo: mockDeudaRepo,
    usuarioRepo: {
      buscarPorCorreo: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmails: jest.fn(),
      buscarPorOauth: jest.fn(),
      crear: jest.fn(),
      actualizarContrasena: jest.fn(),
    },
    sesionRepo: {
      crear: jest.fn(),
      buscarPorTokenHash: jest.fn(),
      actualizarTokenHash: jest.fn(),
      eliminarPorTokenHash: jest.fn(),
      eliminarPorIdUsuario: jest.fn(),
    },
    gastoRepo: {
      crear: jest.fn(),
      obtenerTodos: jest.fn(),
      obtenerPorId: jest.fn(),
    },
    grupoRepo: { crear: jest.fn(), obtenerDetalle: jest.fn() },
    divisionGastoRepo: { crearMuchas: jest.fn() },
    miembroGrupoRepo: {
      buscarPorGrupo: jest.fn(),
      crearMuchas: jest.fn(),
      buscarPorUsuario: jest.fn(),
      buscarMiembrosDeGrupos: jest.fn(),
    },
    tokenRecuperacionRepo: {
      invalidarPorIdUsuario: jest.fn(),
      crear: jest.fn(),
      buscarTokenValido: jest.fn(),
      marcarComoUsado: jest.fn(),
    },
    notificacionRepo: {
      crear: jest.fn(),
      crearMuchas: jest.fn(),
      obtenerPorUsuario: jest.fn(),
      contarNoLeidas: jest.fn(),
      marcarLeida: jest.fn(),
      marcarTodasLeidas: jest.fn(),
    },
    db: { transaction: jest.fn((fn: any) => fn({})) },
  })),
}));

function crearMockRequestConFormData(
  opciones: {
    token?: string;
    archivo?: File | null;
    rut?: string | null;
  } = {},
) {
  const formData = new FormData();
  if (opciones.archivo) formData.append("archivo", opciones.archivo);
  if (opciones.rut) formData.append("rut", opciones.rut);

  const headers = new Map<string, string>();
  if (opciones.token) headers.set("authorization", `Bearer ${opciones.token}`);

  return {
    headers: {
      get: (name: string) => headers.get(name) ?? null,
    },
    formData: jest.fn().mockResolvedValue(formData),
  } as unknown as Request;
}

function crearArchivo(
  contenido = "fake-content",
  nombre = "comprobante.pdf",
  tipo = "application/pdf",
) {
  return new File([contenido], nombre, { type: tipo });
}

const { verificarAccessToken } = jest.requireMock("@/auth/services/jwt");
const { writeFile } = jest.requireMock("node:fs/promises");

function mockUsuarioAutenticado(idUsuario = "u-deudor") {
  verificarAccessToken.mockReturnValue({ idUsuario });
}

function crearComprobanteMock(overrides: Record<string, unknown> = {}) {
  const tipo = (overrides.tipoArchivo as string) || "application/pdf";
  const ext = tipo === "application/pdf" ? ".pdf" : `.${tipo.split("/")[1]}`;
  return {
    id: "c1",
    idDeuda: "d1",
    idUsuario: "u-deudor",
    urlArchivo: `/uploads/comprobantes/uuid-fijo${ext}`,
    tipoArchivo: tipo,
    rut: "12345678-5",
    estado: "pendiente",
    aceptadoEn: null,
    rechazadoEn: null,
    creadoEn: new Date(),
    usuario: { id: "u-deudor", nombre: "Deudor", correo: "d@t.com" },
    ...overrides,
  };
}

function crearDeudaMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "d1",
    idDeudor: "u-deudor",
    idAcreedor: "u-acreedor",
    monto: 100,
    estado: "pendiente",
    saldada: false,
    actualizadoEn: new Date(),
    grupo: { id: "g1", nombre: "G1" },
    deudor: { id: "u-deudor", nombre: "Deudor", correo: "d@t.com" },
    acreedor: { id: "u-acreedor", nombre: "Acreedor", correo: "a@t.com" },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("controladorSubirComprobante", () => {
  it("retorna 401 si no hay token", async () => {
    const req = crearMockRequestConFormData();
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.mensaje).toBe("No autorizado");
  });

  it("retorna 400 si no se envía archivo", async () => {
    mockUsuarioAutenticado();
    const req = crearMockRequestConFormData({
      token: "token-valido",
      rut: "12345678-5",
    });
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("Archivo requerido");
  });

  it("retorna 400 si no se envía RUT", async () => {
    mockUsuarioAutenticado();
    const req = crearMockRequestConFormData({
      token: "token-valido",
      archivo: crearArchivo(),
    });
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("RUT requerido");
  });

  it("retorna 400 si el tipo de archivo no es permitido", async () => {
    mockUsuarioAutenticado();
    const req = crearMockRequestConFormData({
      token: "token-valido",
      archivo: crearArchivo("gif", "test.gif", "image/gif"),
      rut: "12345678-5",
    });
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("Tipo de archivo no permitido");
  });

  it("retorna 201 para JPEG exitoso", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.crear.mockResolvedValue(
      crearComprobanteMock({ tipoArchivo: "image/jpeg" }),
    );

    const req = crearMockRequestConFormData({
      token: "token-valido",
      archivo: crearArchivo("img", "boleta.jpg", "image/jpeg"),
      rut: "12345678-5",
    });
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.exito).toBe(true);
    expect(body.datos.urlArchivo).toContain(".jpeg");
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it("retorna 201 para PDF exitoso", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.crear.mockResolvedValue(crearComprobanteMock());

    const req = crearMockRequestConFormData({
      token: "token-valido",
      archivo: crearArchivo("pdf", "doc.pdf", "application/pdf"),
      rut: "12345678-5",
    });
    const res = await controladorSubirComprobante(req as any, { id: "d1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.datos.urlArchivo).toContain(".pdf");
  });

  it("retorna 400 si el servicio lanza error de negocio", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockRejectedValue(
      new Error("Deuda no encontrada"),
    );

    const req = crearMockRequestConFormData({
      token: "token-valido",
      archivo: crearArchivo(),
      rut: "12345678-5",
    });
    const res = await controladorSubirComprobante(req as any, {
      id: "no-existe",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("Deuda no encontrada");
  });
});

describe("controladorObtenerComprobantes", () => {
  it("retorna 401 si no hay token", async () => {
    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/d1/comprobante",
    });
    const res = await controladorObtenerComprobantes(req, { id: "d1" });
    expect(res.status).toBe(401);
  });

  it("retorna 200 con lista vacía", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.obtenerPorDeuda.mockResolvedValue([]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/d1/comprobante",
      token: "token-valido",
    });
    const res = await controladorObtenerComprobantes(req, { id: "d1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.datos).toHaveLength(0);
  });

  it("retorna 200 con comprobantes", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.obtenerPorDeuda.mockResolvedValue([
      crearComprobanteMock(),
    ]);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/d1/comprobante",
      token: "token-valido",
    });
    const res = await controladorObtenerComprobantes(req, { id: "d1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.datos).toHaveLength(1);
  });

  it("retorna 400 si el servicio lanza error", async () => {
    mockUsuarioAutenticado();
    mockDeudaRepo.obtenerPorId.mockRejectedValue(
      new Error("Deuda no encontrada"),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/no-existe/comprobante",
      token: "token-valido",
    });
    const res = await controladorObtenerComprobantes(req, { id: "no-existe" });
    expect(res.status).toBe(400);
  });
});

describe("controladorAceptarComprobante", () => {
  it("retorna 401 si no hay token", async () => {
    const req = crearMockNextRequest({});
    const res = await controladorAceptarComprobante(req, {
      idComprobante: "c1",
    });
    expect(res.status).toBe(401);
  });

  it("retorna 200 si acepta exitosamente", async () => {
    mockUsuarioAutenticado("u-acreedor");
    mockComprobanteRepo.obtenerPorId.mockResolvedValue(crearComprobanteMock());
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.actualizarEstado.mockResolvedValue(
      crearComprobanteMock({ estado: "aceptado" }),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/comprobante/c1/aceptar",
      token: "token-valido",
      metodo: "POST",
    });
    const res = await controladorAceptarComprobante(req, {
      idComprobante: "c1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exito).toBe(true);
    expect(body.datos.estado).toBe("aceptado");
  });

  it("retorna 400 si hay error de negocio", async () => {
    mockUsuarioAutenticado("u-acreedor");
    mockComprobanteRepo.obtenerPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/comprobante/no-existe/aceptar",
      token: "token-valido",
      metodo: "POST",
    });
    const res = await controladorAceptarComprobante(req, {
      idComprobante: "no-existe",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("Comprobante no encontrado");
  });
});

describe("controladorRechazarComprobante", () => {
  it("retorna 401 si no hay token", async () => {
    const req = crearMockNextRequest({});
    const res = await controladorRechazarComprobante(req, {
      idComprobante: "c1",
    });
    expect(res.status).toBe(401);
  });

  it("retorna 200 si rechaza exitosamente", async () => {
    mockUsuarioAutenticado("u-acreedor");
    mockComprobanteRepo.obtenerPorId.mockResolvedValue(crearComprobanteMock());
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());
    mockComprobanteRepo.actualizarEstado.mockResolvedValue(
      crearComprobanteMock({ estado: "rechazado" }),
    );

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/comprobante/c1/rechazar",
      token: "token-valido",
      metodo: "POST",
    });
    const res = await controladorRechazarComprobante(req, {
      idComprobante: "c1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exito).toBe(true);
  });

  it("retorna 400 si hay error de negocio", async () => {
    mockUsuarioAutenticado("u-acreedor");
    mockComprobanteRepo.obtenerPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/comprobante/no-existe/rechazar",
      token: "token-valido",
      metodo: "POST",
    });
    const res = await controladorRechazarComprobante(req, {
      idComprobante: "no-existe",
    });
    expect(res.status).toBe(400);
  });
});

describe("controladorObtenerDeuda", () => {
  it("retorna 200 con datos de la deuda", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue(crearDeudaMock());

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/d1",
    });
    const res = await controladorObtenerDeuda(req, { id: "d1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.datos.id).toBe("d1");
  });

  it("retorna 404 si la deuda no existe", async () => {
    mockDeudaRepo.obtenerPorId.mockResolvedValue(null);

    const req = crearMockNextRequest({
      url: "http://localhost:3000/api/deudas/no-existe",
    });
    const res = await controladorObtenerDeuda(req, { id: "no-existe" });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.mensaje).toBe("Deuda no encontrada");
  });
});
