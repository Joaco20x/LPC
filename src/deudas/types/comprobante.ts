export interface ComprobanteItem {
  id: string;
  idDeuda: string;
  idUsuario: string;
  urlArchivo: string;
  tipoArchivo: string;
  rut: string;
  estado: "pendiente" | "aceptado" | "rechazado";
  aceptadoEn: Date | null;
  rechazadoEn: Date | null;
  creadoEn: Date;
  usuario: { id: string; nombre: string; correo: string };
}

export interface SubirComprobanteInput {
  idDeuda: string;
  idUsuario: string;
  rut: string;
  archivo: { nombre: string; tipo: string; buffer: ArrayBuffer };
}
