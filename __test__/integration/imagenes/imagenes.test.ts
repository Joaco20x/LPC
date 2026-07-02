import { POST } from "@/app/api/imagenes/subir/route";

jest.mock("@/auth/services/jwt", () => ({
  verificarAccessToken: jest.fn(),
}));

jest.mock("node:fs/promises", () => ({
  writeFile: jest.fn(),
}));

function crearMockRequest(token?: string, archivo?: File | null) {
  const formData = new FormData();
  if (archivo) formData.append("imagen", archivo);

  const headers = new Map<string, string>();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return {
    headers: {
      get: (name: string) => headers.get(name) ?? null,
    },
    formData: jest.fn().mockResolvedValue(formData),
  } as unknown as Request;
}

function crearArchivo(
  contenido = "fake-image-bytes",
  nombre = "boleta.jpg",
  tipo = "image/jpeg",
  tamaño?: number,
): File {
  const blob = new Blob([contenido], { type: tipo });
  return new File(
    [tamaño !== undefined ? new Blob([new Uint8Array(tamaño)]) : blob],
    nombre,
    { type: tipo },
  );
}

const { verificarAccessToken } = jest.requireMock("@/auth/services/jwt");
const { writeFile } = jest.requireMock("node:fs/promises");

describe("POST /api/imagenes/subir", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 si no hay token", async () => {
    const req = crearMockRequest();
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.mensaje).toBe("No autorizado");
  });

  it("retorna 401 si el token es inválido", async () => {
    verificarAccessToken.mockImplementationOnce(() => {
      throw new Error("Token inválido");
    });
    const req = crearMockRequest("token-malo");
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.mensaje).toBe("Token inválido o expirado");
  });

  it("retorna 400 si no se envía imagen", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const req = crearMockRequest("token-valido", null);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toBe("No se envió ninguna imagen");
  });

  it("retorna 400 si el formato no es válido", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const req = crearMockRequest(
      "token-valido",
      crearArchivo("gif", "test.gif", "image/gif"),
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toContain("Formato no válido");
  });

  it("retorna 400 si la imagen supera el tamaño máximo", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const archivo = crearArchivo("", "grande.jpg", "image/jpeg", 800 * 1024);
    const req = crearMockRequest("token-valido", archivo);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.mensaje).toContain("supera los");
  });

  it("retorna 201 con URL si la subida es exitosa", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const archivo = crearArchivo();
    const req = crearMockRequest("token-valido", archivo);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.exito).toBe(true);
    expect(body.datos.url).toMatch(/^\/uploads\/gastos\/.+\.jpeg$/);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it("retorna 500 si ocurre un error inesperado", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const archivo = crearArchivo();
    const req = crearMockRequest("token-valido", archivo);
    writeFile.mockRejectedValueOnce(new Error("Disco lleno"));
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.mensaje).toBe("Error al subir la imagen");
  });

  it("acepta image/png", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const archivo = crearArchivo("png-data", "test.png", "image/png");
    const req = crearMockRequest("token-valido", archivo);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.datos.url).toMatch(/\.png$/);
  });

  it("acepta image/webp", async () => {
    verificarAccessToken.mockReturnValueOnce({ idUsuario: "u1" });
    const archivo = crearArchivo("webp-data", "test.webp", "image/webp");
    const req = crearMockRequest("token-valido", archivo);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.datos.url).toMatch(/\.webp$/);
  });
});
