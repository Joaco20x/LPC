import { NextRequest, NextResponse } from "next/server";
import { obtenerTasaCambio } from "@/shared/servicios/tasasCambio";
import { esMonedaValida } from "@/gastos/types/gasto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")?.toUpperCase();
    const to = searchParams.get("to")?.toUpperCase();

    if (!from || !to) {
      return NextResponse.json(
        { exito: false, mensaje: "Faltan parámetros from y to" },
        { status: 400 },
      );
    }

    if (!esMonedaValida(from) || !esMonedaValida(to)) {
      return NextResponse.json(
        { exito: false, mensaje: "Moneda no válida" },
        { status: 400 },
      );
    }

    const { tasa, fuente } = await obtenerTasaCambio(from, to);

    return NextResponse.json({
      exito: true,
      datos: {
        tasa,
        fuente,
        from,
        to,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al obtener tasa";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}
