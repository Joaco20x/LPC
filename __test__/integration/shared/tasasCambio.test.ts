const mockFetch = jest.fn();
global.fetch = mockFetch;

const API_KEY = "test-api-key";
const URL_BASE = "https://v6.exchangerate-api.com/v6";

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
  process.env["EXCHANGERATE-API"] = API_KEY;
});

describe("obtenerTasaCambio", () => {
  it("retorna tasa 1 para misma moneda", async () => {
    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    const resultado = await obtenerTasaCambio("CLP", "CLP");
    expect(resultado).toEqual({ tasa: 1, fuente: "cache" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("consulta API exitosamente y retorna tasa con fuente api", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: 850 }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    const resultado = await obtenerTasaCambio("USD", "CLP");

    expect(resultado).toEqual({ tasa: 850, fuente: "api" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${URL_BASE}/${API_KEY}/pair/USD/CLP`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("usa caché si la tasa está vigente", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: 850 }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await obtenerTasaCambio("USD", "CLP");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const resultado = await obtenerTasaCambio("USD", "CLP");
    expect(resultado).toEqual({ tasa: 850, fuente: "cache" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("lanza error si la API falla y no hay caché", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await expect(
      obtenerTasaCambio("BRL", "CLP"),
    ).rejects.toThrow("No hay conexión y no hay tasa en caché");
  });

  it("lanza error si la API retorna result distinto de success", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: "error", "error-type": "unsupported-code" }), {
        status: 200,
      }),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await expect(
      obtenerTasaCambio("INVALID", "CLP"),
    ).rejects.toThrow("No hay conexión y no hay tasa en caché");
  });

  it("lanza error si API retorna result error sin error-type", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: "error" }), { status: 200 }),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await expect(
      obtenerTasaCambio("USD", "CLP"),
    ).rejects.toThrow("No hay conexión y no hay tasa en caché");
  });

  it("lanza error si conversion_rate no es número (sin caché)", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: "ochocientos" }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await expect(
      obtenerTasaCambio("USD", "ARS"),
    ).rejects.toThrow("No hay conexión y no hay tasa en caché");
  });

  it("lanza error si no hay API key configurada", async () => {
    delete process.env["EXCHANGERATE-API"];

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await expect(
      obtenerTasaCambio("USD", "CLP"),
    ).rejects.toThrow("No hay conexión y no hay tasa en caché");
  });
});

describe("obtenerTasaCambio — fallback a caché expirada", () => {
  const TIEMPO_INICIAL = 1_000_000_000_000;
  const TIEMPO_EXPIRADO = TIEMPO_INICIAL + 31 * 60 * 1000 + 1;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(TIEMPO_INICIAL);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("usa caché expirada si la API falla (fallback)", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: 800 }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await obtenerTasaCambio("EUR", "CLP");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(TIEMPO_EXPIRADO);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const resultado = await obtenerTasaCambio("EUR", "CLP");
    expect(resultado).toEqual({ tasa: 800, fuente: "cache" });
  });

  it("usa caché expirada si API retorna conversion_rate no numérico", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: 200 }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await obtenerTasaCambio("MXN", "CLP");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(TIEMPO_EXPIRADO);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: "doscientos" }),
        { status: 200 },
      ),
    );

    const resultado = await obtenerTasaCambio("MXN", "CLP");
    expect(resultado).toEqual({ tasa: 200, fuente: "cache" });
  });

  it("usa caché expirada si API retorna error y hay caché previa", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", conversion_rate: 200 }),
        { status: 200 },
      ),
    );

    const { obtenerTasaCambio } = await import(
      "@/shared/servicios/tasasCambio"
    );
    await obtenerTasaCambio("MXN", "CLP");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    (Date.now as jest.Mock).mockReturnValue(TIEMPO_EXPIRADO);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "error", "error-type": "unsupported-code" }),
        { status: 200 },
      ),
    );

    const resultado = await obtenerTasaCambio("MXN", "CLP");
    expect(resultado).toEqual({ tasa: 200, fuente: "cache" });
  });
});
