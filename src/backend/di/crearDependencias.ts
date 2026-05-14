import type { IUsuarioRepository } from '@/shared/repositories/IUsuarioRepository';
import type { IGastoRepository } from '@/shared/repositories/IGastoRepository';
import type { IGrupoRepository } from '@/shared/repositories/IGrupoRepository';
import type { IDeudaRepository } from '@/shared/repositories/IDeudaRepository';
import type { ISesionRepository } from '@/shared/repositories/ISesionRepository';
import type { ITokenRecuperacionRepository } from '@/shared/repositories/ITokenRecuperacionRepository';
import type { IDivisionGastoRepository } from '@/shared/repositories/IDivisionGastoRepository';
import type { IMiembroGrupoRepository } from '@/shared/repositories/IMiembroGrupoRepository';

import { PrismaUsuarioRepository } from '@/backend/repositories/PrismaUsuarioRepository';
import { PrismaGastoRepository } from '@/backend/repositories/PrismaGastoRepository';
import { PrismaGrupoRepository } from '@/backend/repositories/PrismaGrupoRepository';
import { PrismaDeudaRepository } from '@/backend/repositories/PrismaDeudaRepository';
import { PrismaSesionRepository } from '@/backend/repositories/PrismaSesionRepository';
import { PrismaTokenRecuperacionRepository } from '@/backend/repositories/PrismaTokenRecuperacionRepository';
import { PrismaDivisionGastoRepository } from '@/backend/repositories/PrismaDivisionGastoRepository';
import { PrismaMiembroGrupoRepository } from '@/backend/repositories/PrismaMiembroGrupoRepository';

export interface Dependencias {
  usuarioRepo: IUsuarioRepository;
  gastoRepo: IGastoRepository;
  grupoRepo: IGrupoRepository;
  deudaRepo: IDeudaRepository;
  sesionRepo: ISesionRepository;
  tokenRecuperacionRepo: ITokenRecuperacionRepository;
  divisionGastoRepo: IDivisionGastoRepository;
  miembroGrupoRepo: IMiembroGrupoRepository;
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
  };

  return instancias;
}
