// backend/services/deudas/deudas.service.ts
// Obtiene deudas pendientes del usuario autenticado
// Separa en «debo a» (idDeudor === yo) y «me deben» (idAcreedor === yo)

import { prisma } from '@/backend/db/prisma';
import { DeudasPendientes, DeudaItem } from '@/shared/types/deudas';

export async function obtenerDeudasPendientes(idUsuario: string, idGrupo?: string): Promise<DeudasPendientes> {
    const deudas = await prisma.deuda.findMany({
    where: {
        saldada: false,
        ...(idGrupo ? { idGrupo } : {}),
        OR: [
        { idDeudor: idUsuario },
        { idAcreedor: idUsuario },
        ],
    },
    include: {
        deudor:   { select: { id: true, nombre: true, correo: true } },
        acreedor: { select: { id: true, nombre: true, correo: true } },
        grupo:    { select: { id: true, nombre: true } },
    },
    });

    const debo_a: DeudaItem[]   = [];
    const me_deben: DeudaItem[] = [];

    for (const deuda of deudas) {
    const item: DeudaItem = {
        id:           deuda.id,
        monto:        Number(deuda.monto),
        grupo:        deuda.grupo,
        contraparte:  deuda.idDeudor === idUsuario ? deuda.acreedor : deuda.deudor,
        actualizadoEn: deuda.actualizadoEn,
    };

    if (deuda.idDeudor === idUsuario) {
        debo_a.push(item);
    } else {
        me_deben.push(item);
    }
    }

    return { debo_a, me_deben };
}