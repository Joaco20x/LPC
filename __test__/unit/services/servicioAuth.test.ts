const mockFetch = jest.fn();
global.fetch = mockFetch;

afterEach(() => {
  mockFetch.mockReset();
});

describe("servicioAuth", () => {
  it("registrar hace POST a /api/auth/registro", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ exito: true, datos: { accessToken: "token" } }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { registrar } = await import("@/auth/validaciones/servicioAuth");
    const res = await registrar({
      nombre: "Test",
      correo: "test@test.com",
      contrasena: "123456",
      confirmarContrasena: "123456",
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test",
        correo: "test@test.com",
        contrasena: "123456",
        confirmarContrasena: "123456",
      }),
    });
    expect(res.exito).toBe(true);
  });

  it("iniciarSesion hace POST con credentials include", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ exito: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { iniciarSesion } = await import("@/auth/validaciones/servicioAuth");
    const res = await iniciarSesion({
      correo: "test@test.com",
      contrasena: "123456",
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        correo: "test@test.com",
        contrasena: "123456",
      }),
    });
    expect(res.exito).toBe(true);
  });

  it("cerrarSesion hace POST a logout", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { cerrarSesion } = await import("@/auth/validaciones/servicioAuth");
    await cerrarSesion();

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("recuperarContrasena hace POST con correo", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ exito: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { recuperarContrasena } =
      await import("@/auth/validaciones/servicioAuth");
    const res = await recuperarContrasena({ correo: "test@test.com" });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/recuperar-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "test@test.com" }),
    });
    expect(res.exito).toBe(true);
  });

  it("cambiarContrasena hace POST con token y nueva contraseña", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ exito: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { cambiarContrasena } =
      await import("@/auth/validaciones/servicioAuth");
    const res = await cambiarContrasena("reset-token", "nueva-pass");

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/nueva-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "reset-token", contrasena: "nueva-pass" }),
    });
    expect(res.exito).toBe(true);
  });

  it("lanza error si la respuesta no es ok", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ mensaje: "Error test" }), {
        status: 400,
        statusText: "Bad Request",
        headers: { "content-type": "application/json" },
      }),
    );

    const { iniciarSesion } = await import("@/auth/validaciones/servicioAuth");
    await expect(
      iniciarSesion({ correo: "test@test.com", contrasena: "wrong" }),
    ).rejects.toThrow("Error test");
  });

  it("lanza error desconocido si no hay mensaje", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 400,
        statusText: "Bad Request",
        headers: { "content-type": "application/json" },
      }),
    );

    const { iniciarSesion } = await import("@/auth/validaciones/servicioAuth");
    await expect(
      iniciarSesion({ correo: "test@test.com", contrasena: "wrong" }),
    ).rejects.toThrow("Error desconocido");
  });
});
