import { NextRequest, NextResponse } from "next/server";
import { cambiarContrasenaConToken } from "@/auth/services/nueva-contrasena.service";
import { validarContrasena } from "@/auth/validaciones/autenticacion";
import { crearDependencias } from "@/shared/di/crearDependencias";

export async function controladorNuevaContrasena(req: NextRequest) {
  try {
    const { token, contrasena } = await req.json();

    if (!token) {
      return NextResponse.json(
        { exito: false, mensaje: "Token requerido" },
        { status: 400 },
      );
    }

    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) {
      return NextResponse.json(
        { exito: false, mensaje: errorContrasena },
        { status: 400 },
      );
    }

    const { usuarioRepo, sesionRepo, tokenRecuperacionRepo } =
      crearDependencias();
    await cambiarContrasenaConToken(
      token,
      contrasena,
      tokenRecuperacionRepo,
      usuarioRepo,
      sesionRepo,
    );

    return NextResponse.json(
      { exito: true, mensaje: "Contraseña actualizada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al cambiar la contraseña";
    return NextResponse.json({ exito: false, mensaje }, { status: 400 });
  }
}
