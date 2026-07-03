import { DatosGasto, MONEDA_DEFAULT } from "@/gastos/types/gasto";
import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import type { IDivisionGastoRepository } from "@/gastos/repositories/IDivisionGastoRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { IDatabaseService } from "@/shared/libs/IDatabaseService";

export async function registrarGasto(
  datos: DatosGasto,
  gastoRepo: IGastoRepository,
  divisionRepo: IDivisionGastoRepository,
  deudaRepo: IDeudaRepository,
  miembroRepo: IMiembroGrupoRepository,
  db: IDatabaseService,
) {
  return await db.transaction(async (tx) => {
    const idGrupo = datos.idGrupo;
    if (!idGrupo || !datos.idPagador) {
      throw new Error("Faltan identificadores requeridos (Grupo o Pagador)");
    }

    const moneda = datos.moneda || MONEDA_DEFAULT;

    const nuevoGasto = await gastoRepo.crear(
      {
        idGrupo,
        idPagador: datos.idPagador,
        monto: datos.monto ?? 0,
        moneda,
        descripcion: datos.descripcion ?? "",
        categoria: datos.categoria ?? "",
        urlBoleta: datos.urlBoleta ?? null,
      },
      tx,
    );

    if (datos.divisiones && datos.divisiones.length > 0) {
      await divisionRepo.crearMuchas(
        datos.divisiones.map((div) => ({
          idGasto: nuevoGasto.id,
          idUsuario: div.idUsuario,
          montoAsignado: div.montoAsignado,
          tipoDivision: div.tipoDivision,
          moneda: div.moneda || moneda,
        })),
        tx,
      );
    }

    if (datos.divisiones && datos.divisiones.length > 0) {
      const miembrosGrupo = await miembroRepo.buscarPorGrupo(idGrupo, tx);
      const totalMiembros = miembrosGrupo.length;

      if (totalMiembros > 1) {
        const idsEnDivisiones = new Set(
          datos.divisiones.map((d) => d.idUsuario),
        );
        const deudores = miembrosGrupo
          .map((m) => m.idUsuario)
          .filter((id) => !idsEnDivisiones.has(id));

        if (deudores.length > 0) {
          const partePorPersona = Number(datos.monto) / totalMiembros;
          const montoPorAcreedor =
            Math.round((partePorPersona / idsEnDivisiones.size) * 100) / 100;

          const nuevasDeudas = deudores.flatMap((idDeudor) =>
            [...idsEnDivisiones].map((idAcreedor) => ({
              idGrupo,
              idDeudor,
              idAcreedor,
              monto: montoPorAcreedor,
              moneda,
              saldada: false,
            })),
          );

          await deudaRepo.crearMuchas(nuevasDeudas, tx);
        }
      }
    }

    return await gastoRepo.obtenerPorId(nuevoGasto.id);
  });
}

export async function obtenerGastos(gastoRepo: IGastoRepository) {
  return gastoRepo.obtenerTodos();
}

export async function obtenerOpcionesFormulario(
  idUsuario: string,
  miembroRepo: IMiembroGrupoRepository,
) {
  const miembrosGrupo = await miembroRepo.buscarPorUsuario(idUsuario);
  const grupos = miembrosGrupo.map((m) => ({
    id: m.grupo.id,
    nombre: m.grupo.nombre,
    monedaBase: m.grupo.monedaBase,
  }));
  const idGrupos = grupos.map((g) => g.id);
  const miembros = await miembroRepo.buscarMiembrosDeGrupos(idGrupos);
  const usuariosUnicos = Array.from(
    new Map(miembros.map((m) => [m.idUsuario, m.usuario])).values(),
  );
  return { grupos, miembros: usuariosUnicos };
}
