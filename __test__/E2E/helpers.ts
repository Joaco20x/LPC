export function crearMockNextRequest(opciones: {
  metodo?: string;
  url?: string;
  cuerpo?: unknown;
  token?: string | null;
  cookies?: Record<string, string>;
  params?: Record<string, string>;
}) {
  const url = opciones.url || 'http://localhost:3000/api/test';
  const urlObj = new URL(url);

  const mockJson = jest.fn().mockResolvedValue(opciones.cuerpo || {});
  const mockCookiesGet = jest.fn((name: string) => ({
    value: opciones.cookies?.[name] || null,
  }));

  const req: any = {
    json: mockJson,
    cookies: { get: mockCookiesGet },
    headers: new Map<string, string>(),
    nextUrl: urlObj,
    url,
    method: opciones.metodo || 'GET',
  };

  if (opciones.token) {
    req.headers.set('Authorization', `Bearer ${opciones.token}`);
    req.headers.get = (name: string) => {
      if (name.toLowerCase() === 'authorization') return `Bearer ${opciones.token}`;
      return null;
    };
  } else {
    req.headers.get = () => null;
  }

  return req;
}

export function analizarRespuesta(respuesta: Response) {
  return {
    status: (respuesta as any).status || 200,
    body: async () => {
      try {
        const text = await (respuesta as any).text?.();
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    },
    headers: (respuesta as any).headers || {},
    redirected: (respuesta as any).redirected || false,
    url: (respuesta as any).url || '',
  };
}
