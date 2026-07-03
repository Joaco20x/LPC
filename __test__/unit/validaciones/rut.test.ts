import { validarRut } from "@/deudas/validaciones/rut";

describe("validarRut", () => {
  it("retorna true para RUT válido sin puntos", () => {
    expect(validarRut("12345678-5")).toBe(true);
  });

  it("retorna true para RUT corto válido", () => {
    expect(validarRut("1-9")).toBe(true);
  });

  it("retorna true para RUT con dígito K minúscula", () => {
    expect(validarRut("2001-k")).toBe(true);
  });

  it("retorna true para RUT con dígito K mayúscula", () => {
    expect(validarRut("2001-K")).toBe(true);
  });

  it("retorna false para RUT con puntos (formato incorrecto)", () => {
    expect(validarRut("12.345.678-5")).toBe(false);
  });

  it("retorna false para RUT con dígito verificador incorrecto", () => {
    expect(validarRut("12345678-0")).toBe(false);
  });

  it("retorna false para RUT inválido con DV incorrecto", () => {
    expect(validarRut("11111111-2")).toBe(false);
  });

  it("retorna false para string vacío", () => {
    expect(validarRut("")).toBe(false);
  });

  it("retorna false para texto sin formato de RUT", () => {
    expect(validarRut("abcdef")).toBe(false);
  });

  it("retorna false para RUT con más de 8 dígitos", () => {
    expect(validarRut("123456789-5")).toBe(false);
  });

  it("retorna false para RUT con letras en el cuerpo", () => {
    expect(validarRut("12a45678-5")).toBe(false);
  });

  it("retorna true para RUT con dígito verificador 0", () => {
    expect(validarRut("0-0")).toBe(true);
  });
});
