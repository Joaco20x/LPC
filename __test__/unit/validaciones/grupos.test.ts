import { validarCreacionGrupo } from "@/grupos/validaciones/grupos";

describe("validarCreacionGrupo", () => {
  const datosValidos = {
    nombre: "Viaje a Chile",
    pais: "Chile",
    fechaInicio: "2026-07-01",
    fechaFin: "2026-07-15",
    idCreador: "user-1",
    correosIntegrantes: ["amigo@test.com"],
  };

  it("retorna array vacío para datos válidos", () => {
    expect(validarCreacionGrupo(datosValidos)).toHaveLength(0);
  });

  it("retorna error si falta nombre", () => {
    const errores = validarCreacionGrupo({ ...datosValidos, nombre: "" });
    expect(errores).toContainEqual({
      campo: "nombre",
      mensaje: "El nombre del grupo es obligatorio",
    });
  });

  it("retorna error si falta país", () => {
    const errores = validarCreacionGrupo({ ...datosValidos, pais: "" });
    expect(errores).toContainEqual({
      campo: "pais",
      mensaje: "El país es obligatorio",
    });
  });

  it("retorna error si falta fechaInicio", () => {
    const errores = validarCreacionGrupo({ ...datosValidos, fechaInicio: "" });
    expect(errores).toContainEqual({
      campo: "fechaInicio",
      mensaje: "La fecha de inicio es obligatoria",
    });
  });

  it("retorna error si falta fechaFin", () => {
    const errores = validarCreacionGrupo({ ...datosValidos, fechaFin: "" });
    expect(errores).toContainEqual({
      campo: "fechaFin",
      mensaje: "La fecha de fin es obligatoria",
    });
  });

  it("retorna error si no hay integrantes", () => {
    const errores = validarCreacionGrupo({
      ...datosValidos,
      correosIntegrantes: [],
    });
    expect(errores).toContainEqual({
      campo: "integrantes",
      mensaje: "Debes añadir al menos 1 integrante para crear el grupo",
    });
  });

  it("retorna error si hay más de 5 integrantes", () => {
    const errores = validarCreacionGrupo({
      ...datosValidos,
      correosIntegrantes: ["a", "b", "c", "d", "e", "f"],
    });
    expect(errores).toContainEqual({
      campo: "integrantes",
      mensaje: "El grupo supera el límite de 6 integrantes en total",
    });
  });

  it("retorna error si fechaFin es anterior a fechaInicio", () => {
    const errores = validarCreacionGrupo({
      ...datosValidos,
      fechaInicio: "2026-07-15",
      fechaFin: "2026-07-01",
    });
    expect(errores).toContainEqual({
      campo: "fechaFin",
      mensaje: "La fecha de fin no puede ser anterior a la de inicio",
    });
  });

  it("retorna error si falta idCreador", () => {
    const errores = validarCreacionGrupo({ ...datosValidos, idCreador: "" });
    expect(errores).toContainEqual({
      campo: "idCreador",
      mensaje: "El ID del creador es obligatorio",
    });
  });
});
