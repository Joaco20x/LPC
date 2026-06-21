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
  value: { localStorage: localStorageMock, location: { href: "" } },
  writable: true,
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe("peticionAutenticada", () => {
  it("hace fetch con token de localStorage", async () => {
    localStorage.setItem("lpc_access_token", "mi-token");
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const { peticionAutenticada } =
      await import("@/shared/servicios/peticionAutenticada");
    const res = await peticionAutenticada("/api/test");

    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      headers: { Authorization: "Bearer mi-token" },
    });
    expect(res.ok).toBe(true);
  });

  it("hace fetch sin token si no hay en localStorage", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const { peticionAutenticada } =
      await import("@/shared/servicios/peticionAutenticada");
    await peticionAutenticada("/api/test");

    expect(mockFetch).toHaveBeenCalledWith("/api/test", {
      headers: {},
    });
  });

  it("reintenta con token refrescado si recibe 401", async () => {
    localStorage.setItem("lpc_access_token", "token-viejo");
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "no auth" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "token-nuevo" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const { peticionAutenticada } =
      await import("@/shared/servicios/peticionAutenticada");
    const res = await peticionAutenticada("/api/test");

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/test", {
      headers: { Authorization: "Bearer token-viejo" },
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    expect(mockFetch).toHaveBeenNthCalledWith(3, "/api/test", {
      headers: { Authorization: "Bearer token-nuevo" },
    });
    expect(res.ok).toBe(true);
    expect(localStorage.getItem("lpc_access_token")).toBe("token-nuevo");
  });

  it("lanza error si el refresh falla", async () => {
    localStorage.setItem("lpc_access_token", "token-viejo");
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "no auth" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "refresh failed" }), {
          status: 401,
        }),
      );

    const { peticionAutenticada } =
      await import("@/shared/servicios/peticionAutenticada");
    await expect(peticionAutenticada("/api/test")).rejects.toThrow(
      "Sesión expirada",
    );
    expect(localStorage.getItem("lpc_access_token")).toBeNull();
  });
});
