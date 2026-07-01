import { NextRequest, NextResponse } from "next/server";
import {
  registrarGasto,
  obtenerGastos,
  obtenerOpcionesFormulario,
} from "@/gastos/services/gasto.service";
import {
  notificarNuevoGasto,
  notificarPresupuestoSuperado,
} from "@/notificaciones/services/notificacion.service";
import { PrismaGastoRepository } from "@/gastos/repositories/PrismaGastoRepository";
import { validarGasto } from "@/gastos/validaciones/gasto";
import { verificarAccessToken } from "@/auth/services/jwt";
import { crearDependencias } from "@/shared/di/crearDependencias";
import { PrismaDatabaseService } from "@/shared/libs/prismaDatabaseService";

function extraerPayload(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "No autorizado" },
        { status: 401 },
      ),
    };
  }
  try {
    return { payload: verificarAccessToken(authHeader.split(" ")[1]) };
  } catch {
    return {
      error: NextResponse.json(
        { exito: false, mensaje: "Token inválido o expirado" },
        { status: 401 },
      ),
    };
  }
}

export async function controladorCrearGasto(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const cuerpo = await req.json();
    const errores = validarGasto(cuerpo);

    if (errores.length > 0) {
      return NextResponse.json(
        { exito: false, mensaje: "Datos inválidos", errores },
        { status: 400 },
      );
    }

    const deps = crearDependencias();
    const nuevoGasto = await registrarGasto(
      { ...cuerpo, idPagador: cuerpo.idPagador || payload!.idUsuario },
      deps.gastoRepo,
      deps.divisionGastoRepo,
      deps.deudaRepo,
      deps.miembroGrupoRepo,
      PrismaDatabaseService,
    );

    // ── Notificaciones (no críticas: errores no rompen el flujo principal) ──
    if (nuevoGasto && deps.notificacionRepo) {
      try {
        await notificarNuevoGasto(
          {
            idGrupo: nuevoGasto.grupo.id,
            nombreGrupo: nuevoGasto.grupo.nombre,
            idPagador: nuevoGasto.pagador.id,
            nombrePagador: nuevoGasto.pagador.nombre,
            descripcion: nuevoGasto.descripcion,
            monto: Number(nuevoGasto.monto),
          },
          deps.miembroGrupoRepo,
          deps.notificacionRepo,
        );

        // Verificar presupuesto máximo por persona (si el Admin lo configuró)
        const grupoCompleto = await deps.grupoRepo.obtenerDetalle(
          nuevoGasto.grupo.id,
        );

        if (grupoCompleto?.presupuestoPorPersona) {
          const presupuesto = Number(grupoCompleto.presupuestoPorPersona);
          const umbral = grupoCompleto.umbralAlerta
            ? Number(grupoCompleto.umbralAlerta)
            : 100;

          // Gasto acumulado por integrante (suma de divisiones en todo el grupo)
          const acumuladoPorUsuario: Record<string, number> = {};
          for (const g of grupoCompleto.gastos) {
            for (const div of g.divisiones) {
              acumuladoPorUsuario[div.idUsuario] =
                (acumuladoPorUsuario[div.idUsuario] ?? 0) +
                Number(div.montoAsignado);
            }
          }

          const idsAdmin = grupoCompleto.miembros
            .filter((m) => m.rol === "admin")
            .map((m) => m.usuario.id);

          // Solo revisamos a los integrantes cuyo monto cambió con este gasto
          const miembrosInvolucrados = (nuevoGasto.divisiones ?? []).map(
            (d) => ({ id: d.usuario.id, nombre: d.usuario.nombre }),
          );

          await notificarPresupuestoSuperado(
            {
              idGrupo: grupoCompleto.id,
              nombreGrupo: grupoCompleto.nombre,
              presupuestoPorPersona: presupuesto,
              umbralAlerta: umbral,
              miembrosInvolucrados,
              gastoAcumuladoPorUsuario: acumuladoPorUsuario,
              idsAdmin,
            },
            deps.notificacionRepo,
          );
        }
      } catch (errNotif) {
        console.warn("[Notificaciones] Error no crítico:", errNotif);
      }
    }

    return NextResponse.json(
      {
        exito: true,
        mensaje: "Gasto registrado correctamente",
        datos: nuevoGasto,
      },
      { status: 201 },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorObtenerGastos(req: NextRequest) {
  try {
    const { error } = extraerPayload(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const idGrupo = searchParams.get("idGrupo");

    if (idGrupo) {
      const repo = new PrismaGastoRepository();
      const gastos = await repo.obtenerPorGrupo(idGrupo);
      return NextResponse.json({ exito: true, datos: gastos }, { status: 200 });
    }

    const { gastoRepo } = crearDependencias();
    const gastos = await obtenerGastos(gastoRepo);
    return NextResponse.json({ exito: true, datos: gastos }, { status: 200 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}

export async function controladorObtenerOpciones(req: NextRequest) {
  try {
    const { payload, error } = extraerPayload(req);
    if (error) return error;

    const { miembroGrupoRepo } = crearDependencias();
    const opciones = await obtenerOpcionesFormulario(
      payload!.idUsuario,
      miembroGrupoRepo,
    );

    return NextResponse.json({ exito: true, datos: opciones }, { status: 200 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el servidor";
    return NextResponse.json({ exito: false, mensaje }, { status: 500 });
  }
}