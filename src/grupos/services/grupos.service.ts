import type { DatosCreacionGrupo } from "@/grupos/types/grupos";
import type {
  IGrupoRepository,
  DatosActualizarPresupuesto,
} from "@/grupos/repositories/IGrupoRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { IDatabaseService } from "@/shared/libs/IDatabaseService";

export async function crearGrupoViaje(
  datos: DatosCreacionGrupo,
  usuarioRepo: IUsuarioRepository,
  grupoRepo: IGrupoRepository,
  miembroRepo: IMiembroGrupoRepository,
  db: IDatabaseService,
) {
  return await db.transaction(async (tx) => {
    const usuariosInvitados = await usuarioRepo.buscarPorEmails(
      datos.correosIntegrantes,
    );
    if (usuariosInvitados.length !== datos.correosIntegrantes.length) {
      throw new Error(
        "Uno o más correos ingresados no corresponden a usuarios registrados",
      );
    }

    const nuevoGrupo = await grupoRepo.crear(
      {
        nombre: datos.nombre,
        destino: datos.pais,
        fechaInicio: new Date(datos.fechaInicio),
        fechaFin: new Date(datos.fechaFin),
        monedaBase: datos.monedaBase || "CLP",
      },
      tx,
    );

    const invitadosSinCreador = usuariosInvitados.filter(
      (u) => u.id !== datos.idCreador,
    );

    await miembroRepo.crearMuchas(
      [
        { idGrupo: nuevoGrupo.id, idUsuario: datos.idCreador!, rol: "admin" },
        ...invitadosSinCreador.map((user) => ({
          idGrupo: nuevoGrupo.id,
          idUsuario: user.id,
          rol: "miembro",
        })),
      ],
      tx,
    );

    return nuevoGrupo;
  });
}

export async function obtenerGruposDelUsuario(
  idUsuario: string,
  miembroRepo: IMiembroGrupoRepository,
) {
  const membresias = await miembroRepo.buscarPorUsuario(idUsuario);

  return membresias.map((m) => ({
    id: m.grupo.id,
    nombre: m.grupo.nombre,
    destino: m.grupo.destino,
    fechaInicio: m.grupo.fechaInicio,
    fechaFin: m.grupo.fechaFin,
    monedaBase: m.grupo.monedaBase,
    totalMiembros: m.grupo._count.miembros,
    rol: m.rol,
  }));
}

export async function obtenerDetalleGrupo(
  idGrupo: string,
  grupoRepo: IGrupoRepository,
) {
  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");
  return grupo;
}

// ── NUEVO: Admin define presupuesto máximo por persona + umbral de alerta ────
export async function actualizarPresupuestoGrupo(
  idGrupo: string,
  idUsuarioSolicitante: string,
  datos: DatosActualizarPresupuesto,
  grupoRepo: IGrupoRepository,
) {
  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const miembroSolicitante = grupo.miembros.find(
    (m) => m.usuario.id === idUsuarioSolicitante,
  );

  if (miembroSolicitante?.rol !== "admin") {
    throw new Error(
      "Solo el administrador del grupo puede modificar el presupuesto",
    );
  }

  if (
    datos.presupuestoPorPersona !== null &&
    datos.presupuestoPorPersona <= 0
  ) {
    throw new Error("El presupuesto por persona debe ser un valor positivo");
  }

  if (
    datos.umbralAlerta !== null &&
    (datos.umbralAlerta < 1 || datos.umbralAlerta > 100)
  ) {
    throw new Error("El umbral de alerta debe estar entre 1 y 100");
  }

  await grupoRepo.actualizarPresupuesto(idGrupo, datos);

  return {
    presupuestoPorPersona: datos.presupuestoPorPersona,
    umbralAlerta: datos.umbralAlerta,
  };
}
