import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";

export interface UsuarioBalance {
  id: string;
  nombre: string;
  balance: number;
}

export interface TransferenciaSugerida {
  deudor: { id: string; nombre: string };
  acreedor: { id: string; nombre: string };
  monto: number;
}

export async function calcularBalancesYOptimizacion(
  idGrupo: string,
  deudaRepo: IDeudaRepository
) {
  // 1. Obtener todas las deudas pendientes del grupo
  const deudas = await deudaRepo.obtenerTodasPorGrupo(idGrupo);

  const balancesMap = new Map<string, UsuarioBalance>();

  const getOrInitBalance = (id: string, nombre: string) => {
    if (!balancesMap.has(id)) {
      balancesMap.set(id, { id, nombre, balance: 0 });
    }
    return balancesMap.get(id)!;
  };

  let transferenciasSinOptimizar = 0;

  // 2. Calcular balances netos basados en las deudas
  for (const deuda of deudas) {
    const deudor = getOrInitBalance(deuda.idDeudor, deuda.deudor.nombre);
    const acreedor = getOrInitBalance(deuda.idAcreedor, deuda.acreedor.nombre);

    const monto = Number(deuda.monto);

    if (monto > 0) {
      deudor.balance -= monto;
      acreedor.balance += monto;
      transferenciasSinOptimizar++;
    }
  }

  const balances = Array.from(balancesMap.values());

  // 3. Optimización (Algoritmo Greedy)
  const deudores = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balance - b.balance); // Menor a mayor (más negativo primero)

  const acreedores = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance); // Mayor a menor (más positivo primero)

  const transferenciasSugeridas: TransferenciaSugerida[] = [];

  let i = 0; // índice deudores
  let j = 0; // índice acreedores

  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];

    const montoDeuda = Math.abs(deudor.balance);
    const montoCredito = acreedor.balance;

    const montoTransferencia = Math.min(montoDeuda, montoCredito);

    // Redondear a 2 decimales
    const montoRedondeado = Math.round(montoTransferencia * 100) / 100;

    if (montoRedondeado > 0) {
      transferenciasSugeridas.push({
        deudor: { id: deudor.id, nombre: deudor.nombre },
        acreedor: { id: acreedor.id, nombre: acreedor.nombre },
        monto: montoRedondeado,
      });
    }

    deudor.balance += montoTransferencia;
    acreedor.balance -= montoTransferencia;

    if (Math.abs(deudor.balance) < 0.01) i++;
    if (Math.abs(acreedor.balance) < 0.01) j++;
  }

  return {
    balances: balances.map((b) => ({
      ...b,
      balance: Math.round(b.balance * 100) / 100,
    })),
    transferenciasSugeridas,
    estadisticas: {
      transferenciasSinOptimizar,
      transferenciasOptimizadas: transferenciasSugeridas.length,
    },
  };
}

export async function saldarTransferenciaSugerida(
  idGrupo: string,
  idDeudor: string,
  idAcreedor: string,
  monto: number,
  deudaRepo: IDeudaRepository
) {
  // Crear una deuda inversa para reflejar el pago
  // El acreedor original (el que recibe el dinero) ahora es el deudor de este registro de pago
  // El deudor original (el que paga el dinero) ahora es el acreedor de este registro de pago
  // Así el balance general queda saldado matemáticamente.
  await deudaRepo.crearMuchas([
    {
      idGrupo,
      idDeudor: idAcreedor,
      idAcreedor: idDeudor,
      monto,
      saldada: false, // Se deja como false para que cuente en el cálculo de balances y los anule
    },
  ]);
}
