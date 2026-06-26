"use client";

// Componente CalendarioGastos
// Vista mensual en cuadrícula, filtros por categoría e integrante, detalle al hacer clic

import {
    useCalendarioGastos,
    CATEGORIAS,
    COLOR_CATEGORIA,
    type DiaCalendario,
} from "./useCalendarioGastos";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatMonto(monto: number) {
    return monto.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

interface Props {
    idGrupo: string;
}

export default function CalendarioGastos({ idGrupo }: Props) {
    const {
    cargando,
    error,
    mesActual,
    diasCalendario,
    filtroCategoria,
    filtroIntegrante,
    integrantes,
    diaSeleccionado,
    setFiltroCategoria,
    setFiltroIntegrante,
    setDiaSeleccionado,
    irMesAnterior,
    irMesSiguiente,
    } = useCalendarioGastos(idGrupo);

    if (cargando) return <div className="cal-cargando">Cargando calendario...</div>;
    if (error) return <div className="cal-error">{error}</div>;

    return (
    <div className="cal-contenedor">
        {/* ── Filtros ── */}
        <div className="cal-filtros">
        <select
            className="cal-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
        >
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
            ))}
        </select>

        <select
            className="cal-select"
            value={filtroIntegrante}
            onChange={(e) => setFiltroIntegrante(e.target.value)}
        >
            <option value="todos">Todos los integrantes</option>
            {integrantes.map((i) => (
            <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
        </select>

        {/* Leyenda categorías */}
        <div className="cal-leyenda">
            {CATEGORIAS.map((c) => (
            <span key={c} className="cal-leyenda-item">
                <span
                className="cal-punto"
                style={{ background: COLOR_CATEGORIA[c] ?? "#aaa" }}
                />
                {c}
            </span>
            ))}
        </div>
        </div>

        {/* ── Navegación mes ── */}
        <div className="cal-nav">
        <button className="cal-nav-btn" onClick={irMesAnterior}>←</button>
        <h2 className="cal-titulo-mes">
            {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </h2>
        <button className="cal-nav-btn" onClick={irMesSiguiente}>→</button>
        </div>

        {/* ── Cuadrícula ── */}
        <div className="cal-grid">
        {/* Encabezados días semana */}
        {DIAS_SEMANA.map((d) => (
            <div key={d} className="cal-dia-semana">{d}</div>
        ))}

        {/* Celdas de días */}
        {diasCalendario.map((dia, i) => (
            <CeldaDia
            key={i}
            dia={dia}
            seleccionado={diaSeleccionado?.fecha.getTime() === dia.fecha.getTime()}
            onClick={() =>
                setDiaSeleccionado(
                diaSeleccionado?.fecha.getTime() === dia.fecha.getTime() ? null : dia,
                )
            }
            />
        ))}
        </div>

        {/* ── Panel detalle día ── */}
        {diaSeleccionado && (
        <PanelDetalle
            dia={diaSeleccionado}
            onCerrar={() => setDiaSeleccionado(null)}
        />
        )}
    </div>
    );
}

// ── Celda de día ─────────────────────────────────────────────────────────────
function CeldaDia({
    dia,
    seleccionado,
    onClick,
}: {
    dia: DiaCalendario;
    seleccionado: boolean;
    onClick: () => void;
}) {
    const tieneGastos = dia.gastos.length > 0;

    return (
    <button
        className={[
        "cal-celda",
        !dia.esMesActual && "cal-celda--fuera",
        dia.esHoy && "cal-celda--hoy",
        seleccionado && "cal-celda--seleccionada",
        tieneGastos && "cal-celda--con-gastos",
        ]
        .filter(Boolean)
        .join(" ")}
        onClick={onClick}
    > 
        <span className="cal-celda-numero">{dia.fecha.getDate()}</span>

        {tieneGastos && (
        <>
            <span className="cal-celda-monto">{formatMonto(dia.totalMonto)}</span>
            <div className="cal-celda-puntos">
            {dia.categoriasPrincipal.map((cat) => (
                <span
                key={cat}
                className="cal-punto"
                style={{ background: COLOR_CATEGORIA[cat] ?? "#aaa" }}
                title={cat}
                />
            ))}
            </div>
        </>
        )}
    </button>
    );
}

// ── Panel lateral de detalle ─────────────────────────────────────────────────
function PanelDetalle({
    dia,
    onCerrar,
}: {
    dia: DiaCalendario;
    onCerrar: () => void;
}) {
    const fecha = dia.fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    });

    return (
    <div className="cal-panel">
        <div className="cal-panel-header">
        <h3 className="cal-panel-fecha">{fecha}</h3>
        <button className="cal-panel-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {dia.gastos.length === 0 ? (
        <p className="cal-panel-vacio">Sin gastos este día.</p>
        ) : (
        <>
            <p className="cal-panel-total">
            Total: <strong>{formatMonto(dia.totalMonto)}</strong>
            </p>
            <ul className="cal-panel-lista">
            {dia.gastos.map((g) => (
                <li key={g.id} className="cal-panel-item">
                <span
                    className="cal-punto cal-punto--md"
                    style={{ background: COLOR_CATEGORIA[g.categoria] ?? "#aaa" }}
                />
                <div className="cal-panel-item-info">
                    <span className="cal-panel-item-desc">{g.descripcion}</span>
                    <span className="cal-panel-item-meta">
                    {g.categoria} · pagó {g.pagador.nombre}
                    </span>
                </div>
                <span className="cal-panel-item-monto">
                    {formatMonto(Number(g.monto))}
                </span>
                </li>
            ))}
            </ul>
        </>
        )}
    </div>
    );
}