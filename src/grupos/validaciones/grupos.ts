import type { DatosCreacionGrupo, ErrorCampo } from "@/grupos/types/grupos";

export function validarCreacionGrupo(datos: DatosCreacionGrupo): ErrorCampo[] {
  const errores: ErrorCampo[] = [];

  if (!datos.nombre?.trim())
    errores.push({
      campo: "nombre",
      mensaje: "El nombre del grupo es obligatorio",
    });
  if (!datos.pais?.trim())
    errores.push({ campo: "pais", mensaje: "El país es obligatorio" });
  if (!datos.fechaInicio)
    errores.push({
      campo: "fechaInicio",
      mensaje: "La fecha de inicio es obligatoria",
    });
  if (!datos.fechaFin)
    errores.push({
      campo: "fechaFin",
      mensaje: "La fecha de fin es obligatoria",
    });
  if (!datos.idCreador?.trim())
    errores.push({
      campo: "idCreador",
      mensaje: "El ID del creador es obligatorio",
    });

  // Mínimo 1, Máximo 5 invitados (6 en total con el admin)
  if (!datos.correosIntegrantes || datos.correosIntegrantes.length < 1) {
    errores.push({
      campo: "integrantes",
      mensaje: "Debes añadir al menos 1 integrante para crear el grupo",
    });
  } else if (datos.correosIntegrantes.length > 5) {
    errores.push({
      campo: "integrantes",
      mensaje: "El grupo supera el límite de 6 integrantes en total",
    });
  }

  if (datos.fechaInicio && datos.fechaFin) {
    const inicio = new Date(datos.fechaInicio);
    const fin = new Date(datos.fechaFin);
    if (fin < inicio) {
      errores.push({
        campo: "fechaFin",
        mensaje: "La fecha de fin no puede ser anterior a la de inicio",
      });
    }
  }

  return errores;
}
