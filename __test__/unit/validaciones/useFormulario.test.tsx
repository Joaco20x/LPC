/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useFormulario } from "@/auth/validaciones/useFormulario";

describe("useFormulario", () => {
  const inicial = { nombre: "", correo: "" };

  it("retorna estado inicial", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    const [estado] = result.current;
    expect(estado.datos).toEqual(inicial);
    expect(estado.errores).toEqual({});
    expect(estado.cargando).toBe(false);
    expect(estado.enviado).toBe(false);
  });

  it("actualizarCampo modifica el campo y limpia el error", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    act(() => {
      result.current[1].establecerErrores([
        { campo: "nombre", mensaje: "Requerido" },
      ]);
    });
    expect(result.current[0].errores.nombre).toBe("Requerido");
    act(() => {
      result.current[1].actualizarCampo("nombre", "Juan");
    });
    expect(result.current[0].datos.nombre).toBe("Juan");
    expect(result.current[0].errores.nombre).toBeUndefined();
  });

  it("establecerCargando cambia el estado de carga", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    act(() => {
      result.current[1].establecerCargando(true);
    });
    expect(result.current[0].cargando).toBe(true);
  });

  it("establecerEnviado cambia el estado de enviado", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    act(() => {
      result.current[1].establecerEnviado(true);
    });
    expect(result.current[0].enviado).toBe(true);
  });

  it("establecerErrores crea el mapa de errores", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    act(() => {
      result.current[1].establecerErrores([
        { campo: "nombre", mensaje: "Requerido" },
        { campo: "correo", mensaje: "Inválido" },
      ]);
    });
    expect(result.current[0].errores).toEqual({
      nombre: "Requerido",
      correo: "Inválido",
    });
  });

  it("limpiarError elimina un error específico", () => {
    const { result } = renderHook(() => useFormulario(inicial));
    act(() => {
      result.current[1].establecerErrores([
        { campo: "nombre", mensaje: "Requerido" },
      ]);
    });
    act(() => {
      result.current[1].limpiarError("nombre");
    });
    expect(result.current[0].errores.nombre).toBeUndefined();
  });
});
