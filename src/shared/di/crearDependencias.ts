import type { IUsuarioRepository } from "@/auth/repositories/IUsuarioRepository";
import type { IGastoRepository } from "@/gastos/repositories/IGastoRepository";
import type { IGrupoRepository } from "@/grupos/repositories/IGrupoRepository";
import type { IDeudaRepository } from "@/deudas/repositories/IDeudaRepository";
import type { ISesionRepository } from "@/auth/repositories/ISesionRepository";
import type { ITokenRecuperacionRepository } from "@/auth/repositories/ITokenRecuperacionRepository";
import type { IDivisionGastoRepository } from "@/gastos/repositories/IDivisionGastoRepository";
import type { IMiembroGrupoRepository } from "@/grupos/repositories/IMiembroGrupoRepository";
import type { IDatabaseService } from "@/shared/libs/IDatabaseService";
import type { INotificacionRepository } from "@/notificaciones/repositories/INotificacionRepository";

import { PrismaUsuarioRepository } from "@/auth/repositories/PrismaUsuarioRepository";
import { PrismaGastoRepository } from "@/gastos/repositories/PrismaGastoRepository";
import { PrismaGrupoRepository } from "@/grupos/repositories/PrismaGrupoRepository";
import { PrismaDeudaRepository } from "@/deudas/repositories/PrismaDeudaRepository";
import { PrismaSesionRepository } from "@/auth/repositories/PrismaSesionRepository";
import { PrismaTokenRecuperacionRepository } from "@/auth/repositories/PrismaTokenRecuperacionRepository";
import { PrismaDivisionGastoRepository } from "@/gastos/repositories/PrismaDivisionGastoRepository";
import { PrismaMiembroGrupoRepository } from "@/grupos/repositories/PrismaMiembroGrupoRepository";
import { PrismaNotificacionRepository } from "@/notificaciones/repositories/PrismaNotificacionRepository";
import { PrismaDatabaseService } from "@/shared/libs/prismaDatabaseService";

export interface Dependencias {
  usuarioRepo: IUsuarioRepository;
  gastoRepo: IGastoRepository;
  grupoRepo: IGrupoRepository;
  deudaRepo: IDeudaRepository;
  sesionRepo: ISesionRepository;
  tokenRecuperacionRepo: ITokenRecuperacionRepository;
  divisionGastoRepo: IDivisionGastoRepository;
  miembroGrupoRepo: IMiembroGrupoRepository;
  notificacionRepo: INotificacionRepository; // ← NUEVO
  db: IDatabaseService;
}

let instancias: Dependencias | null = null;

export function crearDependencias(): Dependencias {
  if (instancias) return instancias;

  instancias = {
    usuarioRepo: new PrismaUsuarioRepository(),
    gastoRepo: new PrismaGastoRepository(),
    grupoRepo: new PrismaGrupoRepository(),
    deudaRepo: new PrismaDeudaRepository(),
    sesionRepo: new PrismaSesionRepository(),
    tokenRecuperacionRepo: new PrismaTokenRecuperacionRepository(),
    divisionGastoRepo: new PrismaDivisionGastoRepository(),
    miembroGrupoRepo: new PrismaMiembroGrupoRepository(),
    notificacionRepo: new PrismaNotificacionRepository(), // ← NUEVO
    db: PrismaDatabaseService,
  };

  return instancias;
}
