// src/shared/servicios/peticionAutenticada.ts
// Solo se llama desde componentes 'use client'; de todos modos guardamos
// cada acceso a localStorage/window con la comprobación correspondiente.

export async function peticionAutenticada(
  url: string,
  opciones: RequestInit = {},
): Promise<Response> {
  const accessToken =
    typeof window !== "undefined"
      ? localStorage.getItem("lpc_access_token")
      : null;

  const respuesta = await fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  // Si no es 401, devolver respuesta directamente
  if (respuesta.status !== 401) {
    return respuesta;
  }

  // Si es 401, intentar refrescar el token
  const refreshRespuesta = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRespuesta.ok) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("lpc_access_token");
      localStorage.removeItem("lpc_datos_usuario");
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada");
  }

  const { accessToken: nuevoToken } = await refreshRespuesta.json();

  if (typeof window !== "undefined") {
    localStorage.setItem("lpc_access_token", nuevoToken);
  }

  // Reintentar la petición original con el nuevo token
  return fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${nuevoToken}`,
    },
  });
}
