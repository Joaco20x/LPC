import type { Prisma } from "@prisma/client";
import type { DatosCreacionGrupo } from "@/grupos/types/grupos";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { IDatabaseService } from "@/shared/libs/IDatabaseService";
import { obtenerTasaCambio } from "@/shared/servicios/tasasCambio";
import { MONEDA_DEFAULT } from "@/gastos/types/gasto";

export async function crearGrupoViaje(
  datos: DatosCreacionGrupo,
  usuarioRepo: IUsuarioRepository,
  grupoRepo: IGrupoRepository,
  miembroRepo: IMiembroGrupoRepository,
  db: IDatabaseService,
) {
  const idCreador = datos.idCreador;
  if (!idCreador) {
    throw new Error("No se ha especificado el creador del grupo");
  }

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
        monedaBase: datos.monedaBase || MONEDA_DEFAULT,
      },
      tx,
    );

    const invitadosSinCreador = usuariosInvitados.filter(
      (u) => u.id !== idCreador,
    );

    await miembroRepo.crearMuchas(
      [
        { idGrupo: nuevoGrupo.id, idUsuario: idCreador, rol: "admin" },
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

async function calcularTotalEnBase(
  gastos: { monto: number | string | Prisma.Decimal; moneda: string }[],
  monedaBase: string,
): Promise<number> {
  const paresUnicos = new Set(
    gastos
      .filter((g) => g.moneda && g.moneda !== monedaBase)
      .map((g) => `${g.moneda}_${monedaBase}`),
  );

  const tasas: Map<string, number> = new Map();

  await Promise.all(
    [...paresUnicos].map(async (par) => {
      const [origen] = par.split("_");
      try {
        const { tasa } = await obtenerTasaCambio(origen, monedaBase);
        tasas.set(par, tasa);
      } catch {
        tasas.set(par, 1);
      }
    }),
  );

  return gastos.reduce((total, gasto) => {
    const monto = Number(gasto.monto);
    if (gasto.moneda === monedaBase || !gasto.moneda) {
      return total + monto;
    }
    const tasa = tasas.get(`${gasto.moneda}_${monedaBase}`) ?? 1;
    return total + monto * tasa;
  }, 0);
}

export async function obtenerDetalleGrupo(
  idGrupo: string,
  grupoRepo: IGrupoRepository,
) {
  const grupo = await grupoRepo.obtenerDetalle(idGrupo);
  if (!grupo) throw new Error("Grupo no encontrado");

  const totalEnBase = await calcularTotalEnBase(grupo.gastos, grupo.monedaBase);

  return { ...grupo, totalEnBase };
}
