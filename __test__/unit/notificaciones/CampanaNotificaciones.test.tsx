/**
 * @jest-environment jsdom
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import CampanaNotificaciones from "@/notificaciones/components/CampanaNotificaciones";

jest.mock("@/shared/servicios/almacenamientoTokens", () => ({
  obtenerAccessToken: jest.fn(),
}));

const mockObtenerAccessToken = jest.requireMock(
  "@/shared/servicios/almacenamientoTokens",
).obtenerAccessToken;

function crearMockFetch(data: any) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ datos: data }),
  });
}

function notificacionBase(overrides = {}) {
  return {
    id: "n1",
    tipo: "nuevo_gasto",
    metadata: {
      pagador: "Juan",
      monto: 5000,
      descripcion: "Cena",
      nombreGrupo: "Viaje",
    },
    leida: false,
    creadoEn: new Date().toISOString(),
    ...overrides,
  };
}

const TIPOS_NOTIFICACION = [
  {
    tipo: "nuevo_gasto",
    metadata: {
      pagador: "Juan",
      monto: 5000,
      descripcion: "Cena",
      nombreGrupo: "Viaje",
    },
    esperado: "Juan pagó",
  },
  {
    tipo: "pago_deuda",
    metadata: { nombreDeudor: "Pedro", monto: 3000, nombreGrupo: "Viaje" },
    esperado: "Pedro saldó",
  },
  {
    tipo: "alerta_deuda",
    metadata: { nombreGrupo: "Viaje" },
    esperado: "Tienes deudas pendientes",
  },
  {
    tipo: "cierre_viaje",
    metadata: { nombreGrupo: "Viaje" },
    esperado: "ha sido cerrado",
  },
  {
    tipo: "presupuesto_superado",
    metadata: {
      nombreIntegrante: "Ana",
      porcentajeUsado: 85,
      nombreGrupo: "Viaje",
      gastoAcumulado: 8500,
      presupuestoPorPersona: 10000,
    },
    esperado: "Ana alcanzó el 85%",
  },
  {
    tipo: "integrante_anadido",
    metadata: { nuevoIntegrante: "Luis", nombreGrupo: "Viaje" },
    esperado: "Luis se unió",
  },
];

beforeEach(() => {
  mockObtenerAccessToken.mockReturnValue("test-token");
  global.fetch = jest.fn();
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ── Renderizado básico ────────────────────────────────────────────────────────

describe("renderizado básico", () => {
  it("renderiza el botón de campana", () => {
    global.fetch = crearMockFetch([]);
    render(<CampanaNotificaciones />);
    expect(screen.getByTitle("Notificaciones")).toBeTruthy();
  });

  it("no muestra badge cuando no hay no leídas", async () => {
    global.fetch = crearMockFetch([notificacionBase({ leida: true })]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.queryByText("1")).toBeNull();
    });
  });

  it("muestra badge con número de no leídas", async () => {
    global.fetch = crearMockFetch([
      notificacionBase({ id: "n1", leida: false }),
      notificacionBase({ id: "n2", leida: true }),
      notificacionBase({ id: "n3", leida: false }),
    ]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeTruthy();
    });
  });

  it("muestra '99+' en el badge cuando hay más de 99 no leídas", async () => {
    const muchas = Array.from({ length: 100 }, (_, i) =>
      notificacionBase({ id: `n${i}`, leida: false }),
    );
    global.fetch = crearMockFetch(muchas);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByText("99+")).toBeTruthy();
    });
  });
});

// ── Panel de notificaciones ───────────────────────────────────────────────────

describe("panel de notificaciones", () => {
  it("abre el panel al hacer clic en la campana", async () => {
    global.fetch = crearMockFetch([notificacionBase()]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    expect(screen.getByText("Notificaciones")).toBeTruthy();
    expect(screen.getByText("Marcar todas leídas")).toBeTruthy();
  });

  it("muestra el mensaje 'No tienes notificaciones' cuando la lista está vacía", async () => {
    global.fetch = crearMockFetch([]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    expect(screen.getByText("No tienes notificaciones.")).toBeTruthy();
  });

  it("muestra el mensaje de cada tipo de notificación", async () => {
    const notificaciones = TIPOS_NOTIFICACION.map((t, i) =>
      notificacionBase({ id: `n${i}`, tipo: t.tipo, metadata: t.metadata }),
    );
    global.fetch = crearMockFetch(notificaciones);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));

    for (const t of TIPOS_NOTIFICACION) {
      expect(screen.getByText(new RegExp(t.esperado))).toBeTruthy();
    }
  });

  it("cierra el panel al hacer clic fuera", async () => {
    global.fetch = crearMockFetch([notificacionBase()]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    expect(screen.getByText("Notificaciones")).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Notificaciones")).toBeNull();
  });
});

// ── Marcar como leída ─────────────────────────────────────────────────────────

describe("marcar como leída", () => {
  it("marca una notificación como leída al hacer clic", async () => {
    global.fetch = crearMockFetch([
      notificacionBase({ id: "n1", leida: false }),
    ]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));

    const notifItem = screen
      .getByText(/Juan pagó/)
      .closest("div")?.parentElement;
    if (notifItem) fireEvent.click(notifItem);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notificaciones/n1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("marca todas como leídas al hacer clic en el botón", async () => {
    global.fetch = crearMockFetch([
      notificacionBase({ id: "n1", leida: false }),
      notificacionBase({ id: "n2", leida: false }),
    ]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.click(screen.getByText("Marcar todas leídas"));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notificaciones",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

// ── Configuración de tipos ────────────────────────────────────────────────────

describe("configuración de tipos", () => {
  it("abre el panel de configuración", async () => {
    global.fetch = crearMockFetch([notificacionBase()]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.click(screen.getByTitle("Configuración"));

    expect(screen.getByText("Tipos de notificación")).toBeTruthy();
    expect(screen.getByText(/Nuevo gasto/)).toBeTruthy();
  });

  it("oculta notificaciones al desactivar su tipo", async () => {
    global.fetch = crearMockFetch([
      notificacionBase({ id: "n1", tipo: "nuevo_gasto", leida: false }),
      notificacionBase({ id: "n2", tipo: "pago_deuda", leida: false }),
    ]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.click(screen.getByTitle("Configuración"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    fireEvent.click(screen.getByTitle("Configuración"));

    expect(screen.queryByText(/Juan pagó/)).toBeNull();
    expect(screen.getByText(/saldó/)).toBeTruthy();
  });

  it("persiste la configuración en localStorage", async () => {
    global.fetch = crearMockFetch([notificacionBase()]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));
    fireEvent.click(screen.getByTitle("Configuración"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    const guardado = JSON.parse(
      localStorage.getItem("lpc_notif_config") || "{}",
    );
    expect(guardado.nuevo_gasto).toBe(false);
  });
});

// ── Polling ───────────────────────────────────────────────────────────────────

describe("polling", () => {
  it("llama a fetch al montar el componente", () => {
    global.fetch = crearMockFetch([]);
    render(<CampanaNotificaciones />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notificaciones",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
      }),
    );
  });

  it("vuelve a llamar a fetch después del intervalo", () => {
    global.fetch = crearMockFetch([]);
    render(<CampanaNotificaciones />);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("limpia el intervalo al desmontar", () => {
    global.fetch = crearMockFetch([]);
    const { unmount } = render(<CampanaNotificaciones />);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ── Accesibilidad ─────────────────────────────────────────────────────────────

describe("accesibilidad", () => {
  it("incluye aria-label con conteo de no leídas", async () => {
    global.fetch = crearMockFetch([notificacionBase({ leida: false })]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      const btn = screen.getByTitle("Notificaciones");
      expect(btn.getAttribute("aria-label")).toContain("1 sin leer");
    });
  });

  it("aria-label sin conteo si no hay no leídas", async () => {
    global.fetch = crearMockFetch([notificacionBase({ leida: true })]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      const btn = screen.getByTitle("Notificaciones");
      expect(btn.getAttribute("aria-label")).toBe("Notificaciones");
    });
  });

  it("deshabilita botón 'Marcar todas leídas' cuando no hay no leídas", async () => {
    global.fetch = crearMockFetch([notificacionBase({ leida: true })]);

    render(<CampanaNotificaciones />);

    await waitFor(() => {
      expect(screen.getByTitle("Notificaciones")).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle("Notificaciones"));

    const btn = screen.getByText("Marcar todas leídas") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
