const store: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};
Object.defineProperty(global, "localStorage", { value: localStorageMock });
Object.defineProperty(global, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
});

const CLAVE_ACCESS_TOKEN = "lpc_access_token";

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe("almacenamientoTokens", () => {
  it("guarda y obtiene accessToken", async () => {
    const { guardarAccessToken, obtenerAccessToken } =
      await import("@/shared/servicios/almacenamientoTokens");
    guardarAccessToken("token-123");
    expect(obtenerAccessToken()).toBe("token-123");
    expect(localStorage.getItem(CLAVE_ACCESS_TOKEN)).toBe("token-123");
  });

  it("elimina el accessToken", async () => {
    const { guardarAccessToken, eliminarAccessToken, obtenerAccessToken } =
      await import("@/shared/servicios/almacenamientoTokens");
    guardarAccessToken("token-456");
    eliminarAccessToken();
    expect(obtenerAccessToken()).toBeNull();
  });

  it("retorna null si no hay accessToken", async () => {
    const { obtenerAccessToken } =
      await import("@/shared/servicios/almacenamientoTokens");
    expect(obtenerAccessToken()).toBeNull();
  });

  it("guarda y obtiene datos de usuario", async () => {
    const { guardarDatosUsuario, obtenerDatosUsuario } =
      await import("@/shared/servicios/almacenamientoTokens");
    const datos = {
      id: "1",
      nombre: "Test",
      correo: "test@test.com",
      verificado: true,
    };
    guardarDatosUsuario(datos);
    expect(obtenerDatosUsuario()).toEqual(datos);
  });

  it("retorna null si no hay datos de usuario", async () => {
    const { obtenerDatosUsuario } =
      await import("@/shared/servicios/almacenamientoTokens");
    expect(obtenerDatosUsuario()).toBeNull();
  });

  it("elimina datos de usuario", async () => {
    const { guardarDatosUsuario, eliminarDatosUsuario, obtenerDatosUsuario } =
      await import("@/shared/servicios/almacenamientoTokens");
    guardarDatosUsuario({
      id: "1",
      nombre: "Test",
      correo: "test@test.com",
      verificado: true,
    });
    eliminarDatosUsuario();
    expect(obtenerDatosUsuario()).toBeNull();
  });

  it("limpia toda la sesión", async () => {
    const {
      guardarAccessToken,
      guardarDatosUsuario,
      limpiarSesion,
      obtenerAccessToken,
      obtenerDatosUsuario,
    } = await import("@/shared/servicios/almacenamientoTokens");
    guardarAccessToken("token");
    guardarDatosUsuario({
      id: "1",
      nombre: "Test",
      correo: "test@test.com",
      verificado: true,
    });
    limpiarSesion();
    expect(obtenerAccessToken()).toBeNull();
    expect(obtenerDatosUsuario()).toBeNull();
  });
});
