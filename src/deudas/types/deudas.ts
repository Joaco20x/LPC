// shared/types/deudas.ts
// Tipos para el listado de deudas pendientes (0b.0.5)
// OCP: agregar campos nuevos no rompe los existentes

export interface UsuarioResumen {
  id: string;
  nombre: string;
  correo: string;
}

export interface GrupoResumen {
  id: string;
  nombre: string;
}

export interface DeudaItem {
  id: string;
  monto: number;
  grupo: GrupoResumen;
  contraparte: UsuarioResumen; // a quién le debo / quién me debe
  actualizadoEn: Date;
}

export interface DeudasPendientes {
  debo_a: DeudaItem[]; // yo soy el deudor
  me_deben: DeudaItem[]; // yo soy el acreedor
}
