/**
 * @jest-environment jsdom
 */

import { render, fireEvent, screen } from "@testing-library/react";
import SubirBoleta from "@/gastos/components/SubirBoleta";

jest.mock("@/gastos/components/useSubirBoleta");

const mockUseSubirBoleta = jest.requireMock(
  "@/gastos/components/useSubirBoleta",
).useSubirBoleta;

function crearMockHook(overrides: Record<string, unknown> = {}) {
  const defaults = {
    estado: { tipo: "inactivo" },
    ocr: { tipo: "inactivo" },
    subir: jest.fn(),
    limpiar: jest.fn(),
    ejecutarOCR: jest.fn(),
  };
  return { ...defaults, ...overrides };
}

function renderComponent(props: Record<string, unknown> = {}) {
  const defaults = {
    onUrlCambio: jest.fn(),
    onDatosOCR: jest.fn(),
  };
  return render(<SubirBoleta {...defaults} {...props} />);
}

describe("SubirBoleta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubirBoleta.mockReturnValue(crearMockHook());
  });

  it("muestra boton 'Adjuntar boleta' en estado inicial sin url", () => {
    renderComponent();
    expect(screen.getByText("Adjuntar boleta")).toBeDefined();
  });

  it("no muestra el boton si hay urlActual", () => {
    renderComponent({ urlActual: "/uploads/gastos/old.jpg" });
    expect(screen.queryByText("Adjuntar boleta")).toBeNull();
  });

  it("muestra thumbnail si hay urlActual", () => {
    renderComponent({ urlActual: "/uploads/gastos/old.jpg" });
    const img = screen.getByAltText(
      "Vista previa de la boleta",
    ) as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain("/uploads/gastos/old.jpg");
  });

  it("muestra spinner mientras comprime", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({ estado: { tipo: "comprimiendo" } }),
    );
    renderComponent();
    expect(screen.getByText("Comprimiendo...")).toBeDefined();
  });

  it("muestra spinner mientras sube", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({ estado: { tipo: "subiendo", progreso: 0 } }),
    );
    renderComponent();
    expect(screen.getByText("Subiendo imagen...")).toBeDefined();
  });

  it("muestra error con boton reintentar", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: { tipo: "error", mensaje: "Archivo muy grande" },
      }),
    );
    renderComponent();
    expect(screen.getByText("Archivo muy grande")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });

  it("muestra preview, botones cambiar, extraer datos, eliminar al completar", () => {
    const mockLimpiar = jest.fn();
    const mockEjecutarOCR = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        limpiar: mockLimpiar,
        ejecutarOCR: mockEjecutarOCR,
      }),
    );
    renderComponent();

    const img = screen.getByAltText(
      "Vista previa de la boleta",
    ) as HTMLImageElement;
    expect(img.src).toContain("/uploads/gastos/test.jpg");
    expect(screen.getByText("test.jpg")).toBeDefined();
    expect(screen.getByText("Cambiar")).toBeDefined();
    expect(screen.getByText("Extraer datos con OCR")).toBeDefined();
    expect(screen.getByText("Eliminar")).toBeDefined();
  });

  it("muestra 'Extrayendo datos...' mientras procesa OCR", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ocr: { tipo: "procesando" },
      }),
    );
    renderComponent();
    expect(screen.getByText("Extrayendo datos...")).toBeDefined();
  });

  it("muestra monto y fecha detectados por OCR", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ocr: { tipo: "completado", monto: 15430, fecha: "15/03/2025" },
      }),
    );
    renderComponent();
    expect(screen.getByText(/Monto detectado/)).toBeDefined();
    expect(screen.getByText("$15.430")).toBeDefined();
    expect(screen.getByText(/Fecha detectada/)).toBeDefined();
    expect(screen.getByText("15/03/2025")).toBeDefined();
  });

  it("muestra mensaje si OCR no extrajo datos", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ocr: {
          tipo: "completado",
          monto: null,
          fecha: null,
          descripcion: null,
        },
      }),
    );
    renderComponent();
    expect(
      screen.getByText("No se pudieron extraer datos automáticamente."),
    ).toBeDefined();
  });

  it("muestra error de OCR", () => {
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ocr: { tipo: "error", mensaje: "No se pudo leer la imagen" },
      }),
    );
    renderComponent();
    expect(screen.getByText("No se pudo leer la imagen")).toBeDefined();
  });

  it("llama a onUrlCambio al completar subida", () => {
    const onUrlCambio = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
      }),
    );
    renderComponent({ onUrlCambio });
    expect(onUrlCambio).toHaveBeenCalledWith("/uploads/gastos/test.jpg");
  });

  it("llama a onDatosOCR al completar OCR", () => {
    const onDatosOCR = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ocr: {
          tipo: "completado",
          monto: 5000,
          fecha: "01/01/2025",
          descripcion: null,
        },
      }),
    );
    renderComponent({ onDatosOCR });
    expect(onDatosOCR).toHaveBeenCalledWith(5000, "01/01/2025", null);
  });

  it("llama a subir al seleccionar archivo", () => {
    const mockSubir = jest.fn();
    mockUseSubirBoleta.mockReturnValue(crearMockHook({ subir: mockSubir }));
    renderComponent();

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["data"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockSubir).toHaveBeenCalledWith(file);
  });

  it("llama a ejecutarOCR al hacer clic en Extraer datos", () => {
    const mockEjecutarOCR = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        ejecutarOCR: mockEjecutarOCR,
      }),
    );
    renderComponent();
    fireEvent.click(screen.getByText("Extraer datos con OCR"));
    expect(mockEjecutarOCR).toHaveBeenCalled();
  });

  it("llama a limpiar al hacer clic en Eliminar", () => {
    const mockLimpiar = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: {
          tipo: "completado",
          url: "/uploads/gastos/test.jpg",
          nombre: "test.jpg",
        },
        limpiar: mockLimpiar,
      }),
    );
    renderComponent();
    fireEvent.click(screen.getByText("Eliminar"));
    expect(mockLimpiar).toHaveBeenCalled();
  });

  it("llama a limpiar + abre file picker al hacer clic en Reintentar", () => {
    const mockLimpiar = jest.fn();
    mockUseSubirBoleta.mockReturnValue(
      crearMockHook({
        estado: { tipo: "error", mensaje: "Error" },
        limpiar: mockLimpiar,
      }),
    );
    renderComponent();

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = jest.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByText("Reintentar"));
    expect(mockLimpiar).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
