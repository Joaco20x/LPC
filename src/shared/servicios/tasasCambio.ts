interface TasaCache {
  tasa: number;
  timestamp: number;
}

const cacheMemoria: Map<string, TasaCache> = new Map();
const TIEMPO_CACHE = 30 * 60 * 1000;

function claveCache(origen: string, destino: string) {
  return `${origen}_${destino}`;
}

export async function obtenerTasaCambio(
  origen: string,
  destino: string,
): Promise<{ tasa: number; fuente: "api" | "cache" }> {
  if (origen === destino) return { tasa: 1, fuente: "cache" };

  const clave = claveCache(origen, destino);
  const cache = cacheMemoria.get(clave);

  if (cache && Date.now() - cache.timestamp < TIEMPO_CACHE) {
    return { tasa: cache.tasa, fuente: "cache" };
  }

  try {
    const apiKey = process.env["EXCHANGERATE-API"];
    if (!apiKey) throw new Error("EXCHANGERATE-API no configurada");

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${origen}/${destino}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();

    if (data.result !== "success") {
      throw new Error(data["error-type"] || "Error al obtener tasa");
    }

    const tasa = data.conversion_rate;
    if (typeof tasa !== "number") {
      throw new Error("Respuesta inesperada de la API");
    }

    cacheMemoria.set(clave, { tasa, timestamp: Date.now() });
    return { tasa, fuente: "api" };
  } catch {
    if (cache) {
      return { tasa: cache.tasa, fuente: "cache" };
    }
    throw new Error("No hay conexión y no hay tasa en caché");
  }
}
