import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { verificarAccessToken } from "@/auth/services/jwt";

const MAX_BYTES = 700 * 1024;
const TIPOS_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );
    }
    try {
      verificarAccessToken(authHeader.split(" ")[1]);
    } catch {
      return NextResponse.json(
        { exito: false, mensaje: "Token inválido o expirado" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const archivo = formData.get("imagen") as File | null;

    if (!archivo) {
      return NextResponse.json(
        { exito: false, mensaje: "No se envió ninguna imagen" },
        { status: 400 },
      );
    }

    if (!TIPOS_PERMITIDOS.has(archivo.type)) {
      return NextResponse.json(
        {
          exito: false,
          mensaje: "Formato no válido. Usa JPEG, PNG o WebP",
        },
        { status: 400 },
      );
    }

    if (archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { exito: false, mensaje: `La imagen supera los ${MAX_BYTES / 1024} KB` },
        { status: 400 },
      );
    }

    const ext = archivo.type.split("/")[1];
    const nombreArchivo = `${randomUUID()}.${ext}`;
    const rutaDestino = join(
      process.cwd(),
      "public",
      "uploads",
      "gastos",
      nombreArchivo,
    );

    const bytes = await archivo.arrayBuffer();
    await writeFile(rutaDestino, Buffer.from(bytes));

    const url = `/uploads/gastos/${nombreArchivo}`;

    return NextResponse.json(
      { exito: true, datos: { url } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Subir imagen]", error);
    return NextResponse.json(
      { exito: false, mensaje: "Error al subir la imagen" },
      { status: 500 },
    );
  }
}
