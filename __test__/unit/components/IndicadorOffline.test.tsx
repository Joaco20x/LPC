/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import IndicadorOffline from "@/shared/components/IndicadorOffline";

jest.mock("@/shared/hooks/useOnlineStatus", () => ({
  useOnlineStatus: jest.fn(),
}));

jest.mock("@/shared/servicios/colaOffline", () => ({
  obtenerCantidadPendientes: jest.fn(),
  suscribirCola: jest.fn(() => () => {}),
}));

const mockUseOnlineStatus = jest.requireMock(
  "@/shared/hooks/useOnlineStatus",
).useOnlineStatus;
const mockObtenerCantidadPendientes = jest.requireMock(
  "@/shared/servicios/colaOffline",
).obtenerCantidadPendientes;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("IndicadorOffline", () => {
  it("no renderiza nada cuando está online y sin pendientes", () => {
    mockUseOnlineStatus.mockReturnValue(true);
    mockObtenerCantidadPendientes.mockReturnValue(0);

    const { container } = render(<IndicadorOffline />);
    expect(container.innerHTML).toBe("");
  });

  it("muestra indicador offline cuando no hay conexión", () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockObtenerCantidadPendientes.mockReturnValue(0);

    render(<IndicadorOffline />);
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.getByTitle("Sin conexión")).toBeTruthy();
  });

  it("muestra cantidad de pendientes cuando está online con operaciones en cola", () => {
    mockUseOnlineStatus.mockReturnValue(true);
    mockObtenerCantidadPendientes.mockReturnValue(3);

    render(<IndicadorOffline />);
    expect(screen.getByText("3")).toBeTruthy();
    expect(
      screen.getByTitle("3 operaciones pendientes por sincronizar"),
    ).toBeTruthy();
  });

  it("tiene la clase indicador-offline--online cuando está conectado", () => {
    mockUseOnlineStatus.mockReturnValue(true);
    mockObtenerCantidadPendientes.mockReturnValue(1);

    const { container } = render(<IndicadorOffline />);
    const span = container.querySelector(".indicador-offline--online");
    expect(span).toBeTruthy();
  });

  it("tiene la clase indicador-offline--offline cuando está desconectado", () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockObtenerCantidadPendientes.mockReturnValue(0);

    const { container } = render(<IndicadorOffline />);
    const span = container.querySelector(".indicador-offline--offline");
    expect(span).toBeTruthy();
  });
});
