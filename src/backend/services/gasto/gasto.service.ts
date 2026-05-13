// Servicio de gastos
// Accede a Prisma directamente — NO usar Prisma en controllers ni en frontend

import { prisma } from '@/backend/db/prisma';
import { DatosGasto } from '@/shared/types/gasto';

export async function registrarGasto(datos: DatosGasto) {
  return await prisma.$transaction(async (tx) => {
    if (!datos.idGrupo || !datos.idPagador) {
      throw new Error('Faltan identificadores requeridos (Grupo o Pagador)');
    }

    const nuevoGasto = await tx.gasto.create({
      data: {
        idGrupo:     datos.idGrupo,
        idPagador:   datos.idPagador,
        monto:       datos.monto       ?? 0,
        descripcion: datos.descripcion ?? '',
        categoria:   datos.categoria   ?? '',
        urlBoleta:   datos.urlBoleta   ?? null,
      },
      include: {
        pagador: { select: { id: true, nombre: true } },
        grupo:   { select: { id: true, nombre: true } },
      },
    });

    // Crear divisiones si se proporcionaron
    if (datos.divisiones && datos.divisiones.length > 0) {
      await tx.divisionGasto.createMany({
        data: datos.divisiones.map((div) => ({
          idGasto:       nuevoGasto.id,
          idUsuario:     div.idUsuario,
          montoAsignado: div.montoAsignado,
          tipoDivision:  div.tipoDivision,
        })),
      });
    }

    // Retornar con divisiones incluidas
    return await tx.gasto.findUnique({
      where: { id: nuevoGasto.id },
      include: {
        pagador:    { select: { id: true, nombre: true } },
        grupo:      { select: { id: true, nombre: true } },
        divisiones: {
          include: {
            usuario: { select: { id: true, nombre: true } },
          },
        },
      },
    });
  });
}

export async function obtenerGastos() {
  return await prisma.gasto.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      pagador:    { select: { id: true, nombre: true } },
      grupo:      { select: { id: true, nombre: true } },
      divisiones: {
        include: {
          usuario: { select: { id: true, nombre: true } },
        },
      },
    },
  });
}

export async function obtenerOpcionesFormulario(idUsuario: string) {
  // Traer solo los grupos donde el usuario es miembro
  const miembrosGrupo = await prisma.miembroGrupo.findMany({
    where:   { idUsuario },
    include: { grupo: { select: { id: true, nombre: true } } },
  });

  const grupos = miembrosGrupo.map((m) => m.grupo);

  // Traer los miembros de esos grupos para poder asignar divisiones
  const idGrupos = grupos.map((g) => g.id);

  const miembros = idGrupos.length > 0
    ? await prisma.miembroGrupo.findMany({
        where:   { idGrupo: { in: idGrupos } },
        include: { usuario: { select: { id: true, nombre: true } } },
        distinct: ['idUsuario'],
      })
    : [];

  const usuariosUnicos = Array.from(
    new Map(miembros.map((m) => [m.idUsuario, m.usuario])).values()
  );

  return { grupos, miembros: usuariosUnicos };
}
