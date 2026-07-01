import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import { crearDependencias } from "@/shared/di/crearDependencias";

export async function controladorBuscarUsuario(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    verificarAccessToken(token);

    const { searchParams } = new URL(req.url);
    const correo = searchParams.get("correo");

    if (!correo) {
      return NextResponse.json(
        { exito: false, mensaje: "Debes proporcionar un correo" },
        { status: 400 },
      );
    }

    const { usuarioRepo } = crearDependencias();
    const usuario = await usuarioRepo.buscarPorCorreo(correo);

    if (!usuario) {
      return NextResponse.json(
        { exito: false, mensaje: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        exito: true,
        datos: {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const esTokenInvalido =
      error instanceof Error &&
      (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError");
    return NextResponse.json(
      {
        exito: false,
        mensaje: esTokenInvalido
          ? "Token inválido o expirado"
          : "Error al buscar usuario",
      },
      { status: esTokenInvalido ? 401 : 500 },
    );
  }
}
