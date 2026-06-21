"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  guardarAccessToken,
  guardarDatosUsuario,
} from "@/shared/servicios/almacenamientoTokens";

function ContenidoCallbackGoogle() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const error = params.get("error");

    if (error || !accessToken) {
      router.replace("/login?error=oauth_fallido");
      return;
    }

    guardarAccessToken(accessToken);

    const id = params.get("id");
    const nombre = params.get("nombre");
    const correo = params.get("correo");
    const verificado = params.get("verificado");

    if (id && nombre && correo) {
      guardarDatosUsuario({
        id,
        nombre,
        correo,
        verificado: verificado === "true",
      });
    }

    router.replace("/dashboard");
  }, [params, router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <p>Iniciando sesión con Google...</p>
    </div>
  );
}

export default function PaginaCallbackGoogle() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <p>Iniciando sesión con Google...</p>
        </div>
      }
    >
      <ContenidoCallbackGoogle />
    </Suspense>
  );
}
