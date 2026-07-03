/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import SyncToast from "@/shared/components/SyncToast";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("SyncToast", () => {
  it("muestra mensaje de éxito cuando no hay errores", () => {
    render(<SyncToast exitosos={3} errores={[]} onCerrar={() => {}} />);
    expect(screen.getByText("3 registros sincronizados")).toBeTruthy();
  });

  it("muestra mensaje en singular para 1 registro exitoso", () => {
    render(<SyncToast exitosos={1} errores={[]} onCerrar={() => {}} />);
    expect(screen.getByText("1 registro sincronizado")).toBeTruthy();
  });

  it("muestra 'Sin cambios pendientes' cuando hay 0 exitosos", () => {
    render(<SyncToast exitosos={0} errores={[]} onCerrar={() => {}} />);
    expect(screen.getByText("Sin cambios pendientes")).toBeTruthy();
  });

  it("muestra mensaje de error cuando hay errores", () => {
    render(
      <SyncToast
        exitosos={2}
        errores={["Error 400", "Error 500"]}
        onCerrar={() => {}}
      />,
    );
    expect(screen.getByText("2 sincronizados, 2 con error")).toBeTruthy();
  });

  it("muestra solo errores cuando no hay exitosos", () => {
    render(
      <SyncToast exitosos={0} errores={["Error de red"]} onCerrar={() => {}} />,
    );
    expect(screen.getByText("1 operaciones fallaron")).toBeTruthy();
  });

  it("tiene clase sync-toast--exito cuando no hay errores", () => {
    const { container } = render(
      <SyncToast exitosos={3} errores={[]} onCerrar={() => {}} />,
    );
    expect(container.querySelector(".sync-toast--exito")).toBeTruthy();
  });

  it("tiene clase sync-toast--error cuando hay errores", () => {
    const { container } = render(
      <SyncToast exitosos={1} errores={["Error"]} onCerrar={() => {}} />,
    );
    expect(container.querySelector(".sync-toast--error")).toBeTruthy();
  });

  it("llama a onCerrar al hacer clic en el botón cerrar", () => {
    const onCerrar = jest.fn();
    render(<SyncToast exitosos={3} errores={[]} onCerrar={onCerrar} />);

    fireEvent.click(screen.getByText("✕"));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("se oculta al hacer clic en cerrar", () => {
    const { container } = render(
      <SyncToast exitosos={3} errores={[]} onCerrar={() => {}} />,
    );

    fireEvent.click(screen.getByText("✕"));
    expect(container.innerHTML).toBe("");
  });

  it("llama a onCerrar automáticamente después de 5 segundos", () => {
    const onCerrar = jest.fn();
    render(<SyncToast exitosos={3} errores={[]} onCerrar={onCerrar} />);

    expect(onCerrar).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("se oculta automáticamente después de 5 segundos", () => {
    const { container } = render(
      <SyncToast exitosos={3} errores={[]} onCerrar={() => {}} />,
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(container.innerHTML).toBe("");
  });
});
