import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { obtenerAccessToken } from "@/shared/servicios/almacenamientoTokens";
import { encolarOperacion } from "@/shared/servicios/colaOffline";
import { MONEDA_DEFAULT } from "@/gastos/types/gasto";

export interface Opcion {
  id: string;
  nombre: string;
  monedaBase?: string;
}

export interface DivisionFormulario {
  idUsuario: string;
  montoAsignado: string;
  tipoDivision: "igual" | "exacto" | "porcentaje";
  moneda: string;
}

export interface FormularioGasto {
  descripcion: string;
  monto: string;
  moneda: string;
  monedaDestino: string;
  categoria: string;
  idGrupo: string;
  urlBoleta: string;
  divisiones: DivisionFormulario[];
}

const FORMULARIO_VACIO: FormularioGasto = {
  descripcion: "",
  monto: "",
  moneda: MONEDA_DEFAULT,
  monedaDestino: MONEDA_DEFAULT,
  categoria: "",
  idGrupo: "",
  urlBoleta: "",
  divisiones: [],
};

export function useGastoForm() {
  const searchParams = useSearchParams();
  const grupoDesdeUrl = searchParams.get("grupo") || "";
  const Router = useRouter();
  const [grupos, setGrupos] = useState<Opcion[]>([]);
  const [miembros, setMiembros] = useState<Opcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [formulario, setFormulario] = useState<FormularioGasto>({
    ...FORMULARIO_VACIO,
    idGrupo: grupoDesdeUrl,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const token = obtenerAccessToken();

        const res = await fetch("/api/gastos/opciones", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.exito) {
          setGrupos(data.datos.grupos);
          setMiembros(data.datos.miembros);
          // Preseleccionar grupo desde URL, si no, usar el primero disponible
          const idGrupoPrevio =
            grupoDesdeUrl ||
            (data.datos.grupos.length > 0 ? data.datos.grupos[0].id : "");
          if (idGrupoPrevio) {
            setFormulario((f) => ({ ...f, idGrupo: idGrupoPrevio }));
          }
        } else {
          setErrorGlobal(data.mensaje || "Error al cargar opciones.");
        }
      } catch (error) {
        console.error("[useGastoForm]", error);
        setErrorGlobal("Error de red al cargar opciones.");
      } finally {
        setCargando(false);
      }
    })();
  }, [grupoDesdeUrl]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormulario((f) => {
      if (f[name as keyof FormularioGasto] === value) return f;
      const actualizado = { ...f, [name]: value };
      if (name === "idGrupo") {
        const grupo = grupos.find((g) => g.id === value);
        actualizado.monedaDestino = grupo?.monedaBase ?? MONEDA_DEFAULT;
      }
      return actualizado;
    });
    if (errores[name]) setErrores((er) => ({ ...er, [name]: "" }));
  };

  const agregarDivision = () => {
    setFormulario((f) => ({
      ...f,
      divisiones: [
        ...f.divisiones,
        {
          idUsuario: "",
          montoAsignado: "",
          tipoDivision: "igual",
          moneda: f.moneda,
        },
      ],
    }));
  };

  const eliminarDivision = (index: number) => {
    setFormulario((f) => ({
      ...f,
      divisiones: f.divisiones.filter((_, i) => i !== index),
    }));
  };

  const handleDivisionChange = (
    index: number,
    campo: keyof DivisionFormulario,
    valor: string,
  ) => {
    setFormulario((f) => {
      const nuevas = [...f.divisiones];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return { ...f, divisiones: nuevas };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorGlobal("");
    setErrores({});

    try {
      const token = obtenerAccessToken();

      const cuerpo = {
        descripcion: formulario.descripcion || undefined,
        monto: formulario.monto ? Number(formulario.monto) : undefined,
        moneda: formulario.moneda || undefined,
        categoria: formulario.categoria || undefined,
        idGrupo: formulario.idGrupo || undefined,
        urlBoleta: formulario.urlBoleta || null,
        divisiones: formulario.divisiones
          .filter((d) => d.idUsuario)
          .map((d) => ({
            idUsuario: d.idUsuario,
            montoAsignado: Number(d.montoAsignado) || 0,
            tipoDivision: d.tipoDivision,
          })),
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        encolarOperacion({
          tipo: "crear",
          endpoint: "/api/gastos",
          metodo: "POST",
          cuerpo,
        });
        setMensajeExito(
          "¡Gasto guardado offline! Se sincronizará cuando tengas conexión.",
        );
        setFormulario({ ...FORMULARIO_VACIO, idGrupo: formulario.idGrupo });
        setTimeout(() => setMensajeExito(""), 5000);
        return;
      }

      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuerpo),
      });

      const data = await res.json();

      if (data.exito) {
        setMensajeExito("¡Gasto registrado correctamente!");
        window.dispatchEvent(new CustomEvent("gastoRegistrado"));
        setTimeout(() => Router.push("/dashboard"), 2000);
        setFormulario({ ...FORMULARIO_VACIO, idGrupo: formulario.idGrupo });
        setTimeout(() => setMensajeExito(""), 4000);
      } else if (data.errores) {
        const mapa: Record<string, string> = {};
        data.errores.forEach((er: { campo: string; mensaje: string }) => {
          mapa[er.campo] = er.mensaje;
        });
        setErrores(mapa);
      } else {
        setErrorGlobal(data.mensaje || "Error al guardar el gasto.");
      }
    } catch (error) {
      console.error("[useGastoForm]", error);
      setErrorGlobal("Error de red. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return {
    grupos,
    miembros,
    cargando,
    errorGlobal,
    mensajeExito,
    formulario,
    errores,
    guardando,
    handleChange,
    handleSubmit,
    agregarDivision,
    eliminarDivision,
    handleDivisionChange,
  };
}
