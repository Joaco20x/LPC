// Cola de operaciones offline persistida en localStorage
// Se ejecuta FIFO al recuperar conexión

const CLAVE_COLA = "lpc_cola_offline";
const CLAVE_EVENTO = "colaOfflineCambio";

export interface OperacionOffline {
  id: string;
  tipo: "crear" | "editar" | "eliminar";
  endpoint: string;
  metodo: string;
  cuerpo: unknown;
  timestamp: number;
}

function obtenerCola(): OperacionOffline[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLAVE_COLA);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarCola(cola: OperacionOffline[]) {
  localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
  if (typeof globalThis.dispatchEvent === "function") {
    globalThis.dispatchEvent(new CustomEvent(CLAVE_EVENTO));
  }
}

export function encolarOperacion(
  op: Omit<OperacionOffline, "id" | "timestamp">,
) {
  const cola = obtenerCola();
  cola.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  guardarCola(cola);
}

export async function procesarCola(): Promise<{
  exitosos: number;
  errores: string[];
}> {
  const cola = obtenerCola();
  if (cola.length === 0) return { exitosos: 0, errores: [] };

  const token =
    typeof localStorage === "undefined"
      ? null
      : localStorage.getItem("lpc_access_token");

  const exitosos: number[] = [];
  const errores: { idx: number; msg: string }[] = [];

  for (let i = 0; i < cola.length; i++) {
    const op = cola[i];
    try {
      const res = await fetch(op.endpoint, {
        method: op.metodo,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(op.cuerpo),
      });
      if (res.ok) {
        exitosos.push(i);
      } else {
        const body = await res.json().catch(() => ({}));
        errores.push({
          idx: i,
          msg: body.mensaje || `Error ${res.status}`,
        });
      }
    } catch {
      errores.push({ idx: i, msg: "Error de red" });
    }
  }

  const pendientes = cola.filter((_, i) => errores.some((e) => e.idx === i));
  guardarCola(pendientes);

  return {
    exitosos: exitosos.length,
    errores: errores.map((e) => e.msg),
  };
}

export function obtenerCantidadPendientes(): number {
  return obtenerCola().length;
}

export function suscribirCola(onChange: () => void): () => void {
  if (typeof globalThis.addEventListener !== "function") return () => {};
  globalThis.addEventListener(CLAVE_EVENTO, onChange);
  return () => globalThis.removeEventListener(CLAVE_EVENTO, onChange);
}
