import type { DatosCreacionGrupo } from "@/grupos/types/grupos";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
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
