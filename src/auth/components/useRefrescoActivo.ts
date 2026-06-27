"use client";

import { useEffect, useRef } from "react";
import { guardarAccessToken, obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";

const INTERVALO_REFRESCO = 5 * 60 * 1000;
const ULTIMA_ACTIVIDAD_MAXIMA = 5 * 60 * 1000;
const ANTICIPACION_EXPIRACION = 5 * 60 * 1000;

interface PayloadDecodificado {
  exp: number;
}

function decodificarToken(token: string): PayloadDecodificado | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

async function refrescarAccessToken(): Promise<void> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();
    if (data.accessToken) {
      guardarAccessToken(data.accessToken);
    }
  } catch {
    // Silencio — el próximo 401 redirigirá al login
  }
}

export function useRefrescoActivo(): void {
  const ultimaActividad = useRef<number>(0);
  const refrescando = useRef<boolean>(false);

  useEffect(() => {
    ultimaActividad.current = Date.now();

    const actualizarActividad = () => {
      ultimaActividad.current = Date.now();
    };

    const eventos: string[] = [
      "click", "scroll", "mousemove", "keydown", "touchstart",
    ];

    eventos.forEach((evento) =>
      window.addEventListener(evento, actualizarActividad, { passive: true }),
    );

    const intervalo = setInterval(async () => {
      if (refrescando.current) return;

      const ahora = Date.now();
      if (ahora - ultimaActividad.current > ULTIMA_ACTIVIDAD_MAXIMA) return;

      const token = obtenerAccessToken();
      if (!token) return;

      const decodificado = decodificarToken(token);
      if (!decodificado) return;

      const tiempoRestante = (decodificado.exp * 1000) - ahora;
      if (tiempoRestante > ANTICIPACION_EXPIRACION) return;

      refrescando.current = true;
      await refrescarAccessToken();
      refrescando.current = false;
    }, INTERVALO_REFRESCO);

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, actualizarActividad),
      );
      clearInterval(intervalo);
    };
  }, []);
}
