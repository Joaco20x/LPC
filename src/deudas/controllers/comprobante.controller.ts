import { NextRequest, NextResponse } from "next/server";
import { verificarAccessToken } from "@/auth/services/jwt";
import { ComprobanteService } from "@/deudas/services/comprobante.service";
import { crearDependencias } from "@/shared/di/crearDependencias";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const MIMETYPES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function crearComprobanteService() {
  const { comprobanteRepo, deudaRepo } = crearDependencias();
  return new ComprobanteService(comprobanteRepo, deudaRepo);
}

export async function controladorSubirComprobante(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

    const payload = verificarAccessToken(authHeader.split(" ")[1]);
    const formData = await req.formData();
    const archivo = formData.get("archivo") as File | null;
    const rut = formData.get("rut") as string | null;

    if (!archivo)
      return NextResponse.json(
        { exito: false, mensaje: "Archivo requerido" },
        { status: 400 },
      );
    if (!rut)
      return NextResponse.json(
        { exito: false, mensaje: "RUT requerido" },
        { status: 400 },
      );
    if (!MIMETYPES_PERMITIDOS.has(archivo.type))
      return NextResponse.json(
        { exito: false, mensaje: "Tipo de archivo no permitido" },
        { status: 400 },
      );

    const ext =
      archivo.type === "application/pdf"
        ? ".pdf"
        : `.${archivo.type.split("/")[1]}`;
    const nombreArchivo = `${randomUUID()}${ext}`;
    const ruta = join(
      process.cwd(),
      "public",
      "uploads",
      "comprobantes",
      nombreArchivo,
    );

    const buffer = Buffer.from(await archivo.arrayBuffer());
    await writeFile(ruta, buffer);
    const urlArchivo = `/uploads/comprobantes/${nombreArchivo}`;

    const service = crearComprobanteService();
    const comprobante = await service.subir(
      params.id,
      payload.idUsuario,
      rut,
      urlArchivo,
      archivo.type,
    );

    return NextResponse.json(
      { exito: true, mensaje: "Comprobante subido", datos: comprobante },
      { status: 201 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 400 });
  }
}

export async function controladorObtenerComprobantes(
  req: NextRequest,
  params: { id: string },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

    const payload = verificarAccessToken(authHeader.split(" ")[1]);
    const service = crearComprobanteService();
    const comprobantes = await service.obtenerHistorial(
      params.id,
      payload.idUsuario,
    );

    return NextResponse.json(
      { exito: true, mensaje: "Comprobantes obtenidos", datos: comprobantes },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 400 });
  }
}

export async function controladorAceptarComprobante(
  req: NextRequest,
  params: { idComprobante: string },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

    const payload = verificarAccessToken(authHeader.split(" ")[1]);
    const service = crearComprobanteService();
    const comprobante = await service.aceptar(
      params.idComprobante,
      payload.idUsuario,
    );

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Comprobante aceptado — deuda marcada como pagada",
        datos: comprobante,
      },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 400 });
  }
}

export async function controladorRechazarComprobante(
  req: NextRequest,
  params: { idComprobante: string },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      );

    const payload = verificarAccessToken(authHeader.split(" ")[1]);
    const service = crearComprobanteService();
    const comprobante = await service.rechazar(
      params.idComprobante,
      payload.idUsuario,
    );

    return NextResponse.json(
      { exito: true, mensaje: "Comprobante rechazado", datos: comprobante },
      { status: 200 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 400 });
  }
}
