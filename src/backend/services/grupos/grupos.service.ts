import { prisma } from '@/backend/db/prisma';

import type { DatosCreacionGrupo } from '@/shared/types/grupos';

export async function crearGrupoViaje(datos: DatosCreacionGrupo) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar a los usuarios invitados por su correo
    const usuariosInvitados = await tx.usuario.findMany({
      where: {
        correo: { in: datos.correosIntegrantes }
      },
      select: { id: true, correo: true }
    });

    // Validar que todos los correos existan en la BD
    if (usuariosInvitados.length !== datos.correosIntegrantes.length) {
      throw new Error('Uno o más correos ingresados no corresponden a usuarios registrados');
    }

    // 2. Crear el Grupo
    const nuevoGrupo = await tx.grupo.create({
      data: {
        nombre: datos.nombre,
        destino: datos.pais, 
        fechaInicio: new Date(datos.fechaInicio),
        fechaFin: new Date(datos.fechaFin),
        monedaBase: datos.monedaBase || 'CLP',
      },
    });

    // 3. Preparar el arreglo de todos los miembros (Admin + Invitados)
    // Filtramos para que si el creador se agregó a sí mismo, no se intente insertar dos veces
    const invitadosSinCreador = usuariosInvitados.filter(u => u.id !== datos.idCreador);

    const datosMiembros = [
      { idGrupo: nuevoGrupo.id, idUsuario: datos.idCreador!, rol: 'admin' },
      ...invitadosSinCreador.map(user => ({
        idGrupo: nuevoGrupo.id,
        idUsuario: user.id,
        rol: 'miembro'
      }))
    ];

    // 4. Insertar todos los miembros de golpe
    await tx.miembroGrupo.createMany({
      data: datosMiembros
    });

    return nuevoGrupo;
  });
}

export async function obtenerGruposDelUsuario(idUsuario: string) {
  const membresias = await prisma.miembroGrupo.findMany({
    where: { idUsuario },
    include: {
      grupo: {
        include: {
          _count: { select: { miembros: true } },
        },
      },
    },
  });

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

export async function obtenerDetalleGrupo(idGrupo: string) {
  const grupo = await prisma.grupo.findUnique({
    where: { id: idGrupo },
    include: {
      miembros: {
        include: {
          usuario: { select: { id: true, nombre: true, correo: true } }
        }
      },
      gastos: {
        orderBy: { creadoEn: 'desc' },
        include: {
          pagador: { select: { id: true, nombre: true } },
          divisiones: {
            include: {
              usuario: { select: { id: true, nombre: true } }
            }
          }
        }
      }
    }
  });

  if (!grupo) throw new Error('Grupo no encontrado');

  return grupo;
}