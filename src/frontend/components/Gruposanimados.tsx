'use client';

import { useEffect, useRef } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Persona {
  offsetX: number;
  color: string;
  stroke: string;
  bobOffset: number;
}

interface Burbuja {
  linea1: string;
  linea2: string;
  linea3?: string;
  color: string;
}

// Punto de estela del avión con timestamp para desvanecerse a los 2s
interface PuntoEstela {
  x: number;
  y: number;
  creadoEn: number; // timestamp ms
}

// Ruta bezier cúbica de extremo a extremo
interface RutaAvion {
  x0: number; y0: number;   // inicio (borde de pantalla)
  x1: number; y1: number;   // control 1
  x2: number; y2: number;   // control 2
  x3: number; y3: number;   // fin (borde opuesto)
  direccionDerecha: boolean; // para saber dónde empieza la próxima ruta
}

interface EstadoAvion {
  progreso: number;       // 0→1 a lo largo de la ruta
  ruta: RutaAvion;
  estela: PuntoEstela[];
  activo: boolean;
}

interface Transferencia {
  idA: number;
  idB: number;
  progreso: number;    // 0→1
  montoText: string;
  coinX: number;
  coinY: number;
  activa: boolean;
}

interface Rastro {
  x: number;
  y: number;
  alpha: number;
}

interface Grupo {
  id: number;
  etiqueta: string;
  icono: string;
  personas: Persona[];
  burbujas: Burbuja[];
  fondoColor: string;
  bordeColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  burbujaActual: number;
  timerBurbuja: number;
  angulo: number;        // rotación suave según dirección
  escala: number;        // para el pop-in
  escalaTarget: number;
  rastros: Rastro[];
  typingFrames: number;  // frames de "···" antes de mostrar texto
}

// ─── Datos ───────────────────────────────────────────────────────────────────

const GRUPOS_INICIALES: Omit<Grupo, 'x'|'y'|'vx'|'vy'|'burbujaActual'|'timerBurbuja'|'angulo'|'escala'|'escalaTarget'|'rastros'|'typingFrames'>[] = [
  {
    id: 1, etiqueta: 'Cena grupal', icono: '🍽',
    fondoColor: '#f0f4ec', bordeColor: '#b8d4b0',
    personas: [
      { offsetX: 14, color: '#a5d6a7', stroke: '#4a8f4a', bobOffset: 0 },
      { offsetX: 34, color: '#ffcc80', stroke: '#e65100', bobOffset: 0.4 },
      { offsetX: 54, color: '#ef9a9a', stroke: '#880e4f', bobOffset: 0.8 },
      { offsetX: 74, color: '#64b5f6', stroke: '#1565c0', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: '¿Quién pagó?', linea2: '$42.500 entre 4', color: '#c8c8c0' },
      { linea1: 'LPC lo divide', linea2: '$10.625 c/u ✓', color: '#a5d6a7' },
    ],
  },
  {
    id: 2, etiqueta: 'Vuelo', icono: '✈',
    fondoColor: '#fef8f0', bordeColor: '#f0c87a',
    personas: [
      { offsetX: 14, color: '#ce93d8', stroke: '#4a148c', bobOffset: 0 },
      { offsetX: 36, color: '#80cbc4', stroke: '#00695c', bobOffset: 0.5 },
      { offsetX: 58, color: '#ffb74d', stroke: '#e65100', bobOffset: 1.0 },
    ],
    burbujas: [
      { linea1: 'Vuelo $186.000', linea2: '3 personas', color: '#c8c8c0' },
      { linea1: '$62.000 c/u', linea2: '¡Listo! ✓', color: '#80cbc4' },
    ],
  },
  {
    id: 3, etiqueta: 'Hotel', icono: '🏨',
    fondoColor: '#f0f4fe', bordeColor: '#b0bef0',
    personas: [
      { offsetX: 12, color: '#f48fb1', stroke: '#880e4f', bobOffset: 0 },
      { offsetX: 32, color: '#a5d6a7', stroke: '#1b5e20', bobOffset: 0.4 },
      { offsetX: 52, color: '#64b5f6', stroke: '#0d47a1', bobOffset: 0.8 },
      { offsetX: 72, color: '#ffb74d', stroke: '#bf360c', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Airbnb $320.000', linea2: '4 noches', color: '#c8c8c0' },
      { linea1: '$80.000 c/u', linea2: 'sin drama ✓', color: '#b0bef0' },
    ],
  },
  {
    id: 4, etiqueta: 'Bus', icono: '🚌',
    fondoColor: '#fff8f0', bordeColor: '#f0c098',
    personas: [
      { offsetX: 14, color: '#80cbc4', stroke: '#004d40', bobOffset: 0 },
      { offsetX: 36, color: '#ef9a9a', stroke: '#b71c1c', bobOffset: 0.5 },
      { offsetX: 58, color: '#ce93d8', stroke: '#6a1b9a', bobOffset: 1.0 },
    ],
    burbujas: [
      { linea1: 'Bus $24.000', linea2: 'Juan pagó', color: '#c8c8c0' },
      { linea1: '$8.000 c/u', linea2: 'registrado ✓', color: '#80cbc4' },
    ],
  },
  {
    id: 5, etiqueta: 'Grupo viaje', icono: '💬',
    fondoColor: '#f4fef4', bordeColor: '#98d498',
    personas: [
      { offsetX: 14, color: '#a5d6a7', stroke: '#2e7d32', bobOffset: 0 },
      { offsetX: 36, color: '#ffcc80', stroke: '#e65100', bobOffset: 0.4 },
      { offsetX: 58, color: '#64b5f6', stroke: '#1565c0', bobOffset: 0.8 },
      { offsetX: 80, color: '#f48fb1', stroke: '#880e4f', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Total: $485.000', linea2: '$121.250 p/persona', linea3: 'LPC calculó ✓', color: '#98d498' },
      { linea1: '3 deben plata', linea2: 'notificados 🔔', linea3: 'sin discusiones', color: '#c8e6c9' },
    ],
  },
  {
    id: 6, etiqueta: 'Entradas', icono: '🎭',
    fondoColor: '#fef0f8', bordeColor: '#e8b0d8',
    personas: [
      { offsetX: 14, color: '#ce93d8', stroke: '#4a148c', bobOffset: 0 },
      { offsetX: 36, color: '#ef9a9a', stroke: '#b71c1c', bobOffset: 0.6 },
      { offsetX: 58, color: '#80cbc4', stroke: '#004d40', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Concierto $90k', linea2: '$30.000 c/u ✓', color: '#e8b0d8' },
    ],
  },
  {
    id: 7, etiqueta: 'Actividades', icono: '🏄',
    fondoColor: '#f0f8fe', bordeColor: '#98c8e8',
    personas: [
      { offsetX: 12, color: '#64b5f6', stroke: '#1565c0', bobOffset: 0 },
      { offsetX: 32, color: '#a5d6a7', stroke: '#1b5e20', bobOffset: 0.4 },
      { offsetX: 52, color: '#ffb74d', stroke: '#bf360c', bobOffset: 0.8 },
      { offsetX: 72, color: '#ce93d8', stroke: '#4a148c', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Kayak $48.000', linea2: '$12.000 c/u ✓', color: '#98c8e8' },
    ],
  },
  {
    id: 8, etiqueta: 'Supermercado', icono: '🛒',
    fondoColor: '#fff8e8', bordeColor: '#e8d098',
    personas: [
      { offsetX: 14, color: '#ffcc80', stroke: '#f57f17', bobOffset: 0 },
      { offsetX: 36, color: '#ef9a9a', stroke: '#b71c1c', bobOffset: 0.5 },
      { offsetX: 58, color: '#80cbc4', stroke: '#00695c', bobOffset: 1.0 },
    ],
    burbujas: [
      { linea1: 'Compras $67.500', linea2: '3 personas', linea3: '$22.500 c/u ✓', color: '#e8d098' },
    ],
  },
  {
    id: 9, etiqueta: 'Bar nocturno', icono: '🍻',
    fondoColor: '#f8f0fe', bordeColor: '#c8a8e8',
    personas: [
      { offsetX: 14, color: '#ce93d8', stroke: '#6a1b9a', bobOffset: 0 },
      { offsetX: 36, color: '#f48fb1', stroke: '#880e4f', bobOffset: 0.4 },
      { offsetX: 56, color: '#64b5f6', stroke: '#0d47a1', bobOffset: 0.8 },
      { offsetX: 74, color: '#a5d6a7', stroke: '#1b5e20', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Cervezas $28k', linea2: 'Ana pagó todo', linea3: '$7.000 c/u ✓', color: '#c8a8e8' },
    ],
  },
  {
    id: 10, etiqueta: 'Combustible', icono: '⛽',
    fondoColor: '#f0fef4', bordeColor: '#90d4a0',
    personas: [
      { offsetX: 14, color: '#a5d6a7', stroke: '#2e7d32', bobOffset: 0 },
      { offsetX: 34, color: '#ffcc80', stroke: '#e65100', bobOffset: 0.4 },
      { offsetX: 54, color: '#64b5f6', stroke: '#1565c0', bobOffset: 0.8 },
      { offsetX: 74, color: '#ef9a9a', stroke: '#c62828', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Bencina $52.000', linea2: '$13.000 c/u ✓', color: '#90d4a0' },
    ],
  },
  {
    id: 11, etiqueta: 'Ski', icono: '🎿',
    fondoColor: '#fef4f0', bordeColor: '#e8b898',
    personas: [
      { offsetX: 12, color: '#ffb74d', stroke: '#e65100', bobOffset: 0 },
      { offsetX: 34, color: '#ce93d8', stroke: '#4a148c', bobOffset: 0.5 },
      { offsetX: 56, color: '#80cbc4', stroke: '#004d40', bobOffset: 1.0 },
    ],
    burbujas: [
      { linea1: 'Forfait $135k', linea2: '$45.000 c/u ✓', color: '#e8b898' },
    ],
  },
  {
    id: 12, etiqueta: 'Mochileros', icono: '🎒',
    fondoColor: '#f0f8f0', bordeColor: '#a0c8a0',
    personas: [
      { offsetX: 14, color: '#a5d6a7', stroke: '#1b5e20', bobOffset: 0 },
      { offsetX: 34, color: '#f48fb1', stroke: '#880e4f', bobOffset: 0.4 },
      { offsetX: 54, color: '#ffcc80', stroke: '#f57f17', bobOffset: 0.8 },
      { offsetX: 74, color: '#64b5f6', stroke: '#0d47a1', bobOffset: 1.2 },
    ],
    burbujas: [
      { linea1: 'Viaje 5 días', linea2: '$203k → $50.750', linea3: 'por persona ✓', color: '#a0c8a0' },
    ],
  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const CARD_W = 105;
const CARD_H = 78;
const PERSONA_R = 9;
const BURBUJA_W = 112;
const BURBUJA_H = (b: Burbuja) => (b.linea3 ? 48 : 36);
const BURBUJA_FRAMES = 210;
const TYPING_FRAMES = 35;
const MAX_RASTROS = 10;
const TRANSFER_COOLDOWN = 360; // frames entre transferencias
const TRANSFER_DIST = 180;     // distancia máxima para iniciar transferencia

const MONTOS = ['$8.500', '$12.000', '$24.750', '$6.000', '$18.300', '$45.000', '$9.900'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function GruposAnimados() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gruposRef = useRef<Grupo[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const transferenciaRef = useRef<Transferencia | null>(null);
  const cooldownRef = useRef<number>(0);
  const avionRef = useRef<EstadoAvion | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Inicializar grupos ──────────────────────────────────────────────────
    const margin = 20;
    gruposRef.current = GRUPOS_INICIALES.map((g, i) => {
      const cols = 4;
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        ...g,
        x: margin + col * 220 + Math.random() * 60,
        y: margin + row * 160 + Math.random() * 40,
        vx: (Math.random() * 0.35 + 0.25) * (Math.random() < 0.5 ? 1 : -1),
        vy: (Math.random() * 0.35 + 0.25) * (Math.random() < 0.5 ? 1 : -1),
        burbujaActual: 0,
        timerBurbuja: Math.floor(Math.random() * BURBUJA_FRAMES),
        angulo: 0,
        escala: 0,
        escalaTarget: 1,
        rastros: [],
        typingFrames: 0,
      };
    });

    // ── Resize ──────────────────────────────────────────────────────────────
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // ── Dibujar cara ────────────────────────────────────────────────────────
    function dibujarPersona(ctx: CanvasRenderingContext2D, px: number, py: number, p: Persona) {
      // Cuerpo
      ctx.beginPath();
      ctx.arc(px, py, PERSONA_R, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ojos
      ctx.fillStyle = p.stroke;
      ctx.beginPath();
      ctx.arc(px - 3, py - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 3, py - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Sonrisa
      ctx.beginPath();
      ctx.arc(px, py + 1, 3.5, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // ── Dibujar burbuja ─────────────────────────────────────────────────────
    function dibujarBurbuja(
      ctx: CanvasRenderingContext2D,
      bx: number, by: number,
      burbuja: Burbuja,
      alpha: number,
      typing: boolean
    ) {
      const bh = BURBUJA_H(burbuja);
      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur = 8;
      roundRect(ctx, bx, by, BURBUJA_W, bh, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = burbuja.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Colita
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + bh);
      ctx.lineTo(bx + 22, by + bh + 10);
      ctx.lineTo(bx + 32, by + bh);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = burbuja.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (typing) {
        // Puntos de typing animados
        const dots = ['·', '· ·', '· · ·'];
        const d = dots[Math.floor(Date.now() / 400) % 3];
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#9a9a94';
        ctx.textAlign = 'center';
        ctx.fillText(d, bx + BURBUJA_W / 2, by + bh / 2 + 4);
      } else {
        ctx.font = '500 8.5px system-ui, sans-serif';
        ctx.fillStyle = '#2a2a28';
        ctx.textAlign = 'left';
        ctx.fillText(burbuja.linea1, bx + 8, by + 13);
        ctx.font = '8px system-ui, sans-serif';
        ctx.fillStyle = '#5a5a55';
        ctx.fillText(burbuja.linea2, bx + 8, by + 25);
        if (burbuja.linea3) ctx.fillText(burbuja.linea3, bx + 8, by + 37);
      }

      ctx.restore();
    }

    // ── Dibujar rastro ──────────────────────────────────────────────────────
    function dibujarRastros(ctx: CanvasRenderingContext2D, g: Grupo) {
      g.rastros.forEach((r) => {
        ctx.beginPath();
        ctx.arc(r.x + CARD_W / 2, r.y + CARD_H / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,180,160,${r.alpha * 0.18})`;
        ctx.fill();
      });
    }

    // ── Dibujar grupo ────────────────────────────────────────────────────────
    function dibujarGrupo(ctx: CanvasRenderingContext2D, g: Grupo, frame: number) {
      const { x, y, angulo, escala } = g;
      const cx = x + CARD_W / 2;
      const cy = y + CARD_H / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angulo);
      ctx.scale(escala, escala);
      ctx.translate(-cx, -cy);

      // Rastros
      dibujarRastros(ctx, g);

      // Tarjeta
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 10;
      roundRect(ctx, x, y, CARD_W, CARD_H, 12);
      ctx.fillStyle = g.fondoColor;
      ctx.fill();
      ctx.strokeStyle = g.bordeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Icono + etiqueta
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.icono, x + CARD_W / 2, y + 15);
      ctx.font = '7.5px system-ui, sans-serif';
      ctx.fillStyle = '#6b7a6b';
      ctx.fillText(g.etiqueta, x + CARD_W / 2, y + 27);

      // Personas con caras
      g.personas.forEach((p) => {
        const bobY = Math.sin(frame * 0.04 + p.bobOffset) * 2.5;
        const px = x + p.offsetX;
        const py = y + CARD_H - 18 + bobY;
        dibujarPersona(ctx, px, py, p);
      });

      ctx.restore();

      // Burbuja (fuera del transform para que no rote)
      const burbuja = g.burbujas[g.burbujaActual % g.burbujas.length];
      const t = g.timerBurbuja;
      let alpha = 0;
      if (t < 20) alpha = t / 20;
      else if (t > BURBUJA_FRAMES - 20) alpha = (BURBUJA_FRAMES - t) / 20;
      else alpha = 1;

      if (alpha > 0) {
        const bx = x + CARD_W / 2 - BURBUJA_W / 2;
        const bh = BURBUJA_H(burbuja);
        const by = y - bh - 14;
        const isTyping = g.typingFrames > 0;
        dibujarBurbuja(ctx, bx, by, burbuja, alpha, isTyping);
      }
    }

    // ── Dibujar transferencia ───────────────────────────────────────────────
    function dibujarTransferencia(ctx: CanvasRenderingContext2D, tr: Transferencia, grupos: Grupo[]) {
      const gA = grupos.find(g => g.id === tr.idA);
      const gB = grupos.find(g => g.id === tr.idB);
      if (!gA || !gB) return;

      const ax = gA.x + CARD_W / 2;
      const ay = gA.y + CARD_H / 2;
      const bx = gB.x + CARD_W / 2;
      const by = gB.y + CARD_H / 2;

      const progress = tr.progreso;
      const alpha = progress < 0.15 ? progress / 0.15
        : progress > 0.85 ? (1 - progress) / 0.15
        : 1;

      // Línea punteada entre grupos
      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Moneda viajando a lo largo de la línea con arco
      const t = progress;
      const midX = (ax + bx) / 2;
      const midY = (ay + by) / 2 - 30;
      // curva cuadrática
      const coinX = (1-t)*(1-t)*ax + 2*(1-t)*t*midX + t*t*bx;
      const coinY = (1-t)*(1-t)*ay + 2*(1-t)*t*midY + t*t*by;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Sombra de la moneda
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 6;

      // Moneda
      ctx.beginPath();
      ctx.arc(coinX, coinY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Símbolo $
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('$', coinX, coinY + 4);

      // Monto flotante
      ctx.font = '500 8px system-ui, sans-serif';
      ctx.fillStyle = '#2e7d32';
      ctx.fillText(tr.montoText, coinX, coinY - 17);

      ctx.restore();
    }

    // ── Partículas de fondo ─────────────────────────────────────────────────
    const particulas: { x: number; y: number; vy: number; alpha: number; size: number }[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 900,
      vy: -(Math.random() * 0.3 + 0.1),
      alpha: Math.random() * 0.12 + 0.04,
      size: Math.random() * 6 + 4,
    }));

    function dibujarParticulas(ctx: CanvasRenderingContext2D, W: number, H: number) {
      particulas.forEach((p) => {
        p.y += p.vy;
        if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4a8f4a';
        ctx.fillText('$', p.x, p.y);
        ctx.restore();
      });
    }

    // ── Avión ────────────────────────────────────────────────────────────────

    // Genera una ruta bezier cúbica de un borde al opuesto con curvas variadas
    function generarRuta(W: number, H: number, desdeDerecha: boolean): RutaAvion {
      const tipo = Math.floor(Math.random() * 4); // 4 tipos de curva
      const margen = -30; // empieza/termina fuera de pantalla

      let x0: number, y0: number, x3: number, y3: number;
      let x1: number, y1: number, x2: number, y2: number;

      if (desdeDerecha) {
        x0 = W - margen; y0 = Math.random() * H * 0.8 + H * 0.1;
        x3 = margen;     y3 = Math.random() * H * 0.8 + H * 0.1;
      } else {
        x0 = margen;     y0 = Math.random() * H * 0.8 + H * 0.1;
        x3 = W - margen; y3 = Math.random() * H * 0.8 + H * 0.1;
      }

      // Distintos patrones de curva
      switch (tipo) {
        case 0: // arco suave hacia arriba
          x1 = x0 + (x3 - x0) * 0.3; y1 = Math.min(y0, y3) - H * 0.25;
          x2 = x0 + (x3 - x0) * 0.7; y2 = Math.min(y0, y3) - H * 0.15;
          break;
        case 1: // S invertida
          x1 = x0 + (x3 - x0) * 0.25; y1 = y0 + H * 0.3;
          x2 = x0 + (x3 - x0) * 0.75; y2 = y3 - H * 0.3;
          break;
        case 2: // diagonal pronunciada
          x1 = x0 + (x3 - x0) * 0.4; y1 = y0 * 0.3;
          x2 = x0 + (x3 - x0) * 0.6; y2 = y3 * 1.5;
          break;
        default: // curva amplia hacia abajo
          x1 = x0 + (x3 - x0) * 0.3; y1 = Math.max(y0, y3) + H * 0.2;
          x2 = x0 + (x3 - x0) * 0.7; y2 = Math.max(y0, y3) + H * 0.1;
      }

      return { x0, y0, x1, y1, x2, y2, x3, y3, direccionDerecha: desdeDerecha };
    }

    // Evalúa un punto en la curva bezier cúbica dado t ∈ [0,1]
    function bezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
      const u = 1 - t;
      return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
    }

    // Dibuja un avión comercial tipo 737/A320 rotado según la tangente
    function dibujarAvion(ctx: CanvasRenderingContext2D, x: number, y: number, angulo: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo);

      const s = 1.9; // escala global

      // ── Fuselaje (tubo alargado) ──
      ctx.beginPath();
      ctx.ellipse(2 * s, 0, 26 * s, 5 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e8e6';
      ctx.fill();
      ctx.strokeStyle = '#9a9a96';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── Nariz redondeada ──
      ctx.beginPath();
      ctx.ellipse(26 * s, 0, 6 * s, 4.2 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d0d0cc';
      ctx.fill();
      ctx.strokeStyle = '#9a9a96';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── Franja de color en el fuselaje ──
      ctx.beginPath();
      ctx.rect(-18 * s, -2.5 * s, 42 * s, 2 * s);
      ctx.fillStyle = '#2d4a3e';
      ctx.fill();

      // ── Ventanillas ──
      ctx.fillStyle = '#b8d8f0';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse((10 + i * 4.5) * s - 20 * s, -1 * s, 1.3 * s, 1.8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Ala principal izquierda (abajo en canvas = sur) ──
      ctx.beginPath();
      ctx.moveTo(8 * s, 3 * s);
      ctx.lineTo(-2 * s, 28 * s);
      ctx.lineTo(-14 * s, 27 * s);
      ctx.lineTo(-8 * s, 3 * s);
      ctx.closePath();
      ctx.fillStyle = '#d8d8d4';
      ctx.strokeStyle = '#9a9a96';
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();

      // ── Ala principal derecha (arriba en canvas = norte) ──
      ctx.beginPath();
      ctx.moveTo(8 * s, -3 * s);
      ctx.lineTo(-2 * s, -28 * s);
      ctx.lineTo(-14 * s, -27 * s);
      ctx.lineTo(-8 * s, -3 * s);
      ctx.closePath();
      ctx.fillStyle = '#d8d8d4';
      ctx.strokeStyle = '#9a9a96';
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();

      // ── Winglets (puntitas de alas) ──
      ctx.beginPath();
      ctx.moveTo(-2 * s, 28 * s);
      ctx.lineTo(-5 * s, 32 * s);
      ctx.lineTo(-8 * s, 28 * s);
      ctx.fillStyle = '#2d4a3e';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-2 * s, -28 * s);
      ctx.lineTo(-5 * s, -32 * s);
      ctx.lineTo(-8 * s, -28 * s);
      ctx.fillStyle = '#2d4a3e';
      ctx.fill();

      // ── Cola vertical ──
      ctx.beginPath();
      ctx.moveTo(-20 * s, 0);
      ctx.lineTo(-28 * s, -14 * s);
      ctx.lineTo(-22 * s, -13 * s);
      ctx.lineTo(-18 * s, 0);
      ctx.closePath();
      ctx.fillStyle = '#2d4a3e';
      ctx.fill();

      // ── Estabilizadores horizontales ──
      ctx.beginPath();
      ctx.moveTo(-18 * s, 2 * s);
      ctx.lineTo(-26 * s, 13 * s);
      ctx.lineTo(-28 * s, 11 * s);
      ctx.lineTo(-20 * s, 2 * s);
      ctx.closePath();
      ctx.fillStyle = '#c8c8c4';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-18 * s, -2 * s);
      ctx.lineTo(-26 * s, -13 * s);
      ctx.lineTo(-28 * s, -11 * s);
      ctx.lineTo(-20 * s, -2 * s);
      ctx.closePath();
      ctx.fillStyle = '#c8c8c4';
      ctx.fill();

      // ── Motores (uno por ala) ──
      // Motor ala derecha
      ctx.beginPath();
      ctx.ellipse(-1 * s, -18 * s, 5.5 * s, 2.8 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#b0b0ac';
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(2 * s, -18 * s, 2 * s, 2.5 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#606060';
      ctx.fill();

      // Motor ala izquierda
      ctx.beginPath();
      ctx.ellipse(-1 * s, 18 * s, 5.5 * s, 2.8 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#b0b0ac';
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 0.7;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(2 * s, 18 * s, 2 * s, 2.5 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#606060';
      ctx.fill();

      ctx.restore();
    }

    // Dibuja la estela de guiones que se desvanecen
    function dibujarEstela(ctx: CanvasRenderingContext2D, estela: PuntoEstela[], ahora: number) {
      const VIDA_MS = 2000;
      for (let i = 2; i < estela.length; i++) {
        const p = estela[i];
        const edad = ahora - p.creadoEn;
        if (edad > VIDA_MS) continue;
        const alpha = (1 - edad / VIDA_MS) * 0.7;
        // Guiones cada 4 puntos
        if (i % 4 !== 0) continue;
        const prev = estela[i - 2];
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#2a2a28';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.setLineDash([6, 9]);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Inicializar el avión
    avionRef.current = {
      progreso: 0,
      ruta: generarRuta(canvas.width || 800, canvas.height || 600, false),
      estela: [],
      activo: true,
    };

    // ── Loop principal ────────────────────────────────────────────────────────
    function loop() {
      if (!canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      frameRef.current++;
      const frame = frameRef.current;

      ctx.clearRect(0, 0, W, H);

      // Partículas de fondo
      dibujarParticulas(ctx, W, H);

      const grupos = gruposRef.current;
      cooldownRef.current = Math.max(0, cooldownRef.current - 1);

      // ── Iniciar transferencia ocasional ──────────────────────────────────
      if (!transferenciaRef.current && cooldownRef.current === 0) {
        for (let i = 0; i < grupos.length; i++) {
          for (let j = i + 1; j < grupos.length; j++) {
            const gA = grupos[i];
            const gB = grupos[j];
            const dx = (gA.x + CARD_W / 2) - (gB.x + CARD_W / 2);
            const dy = (gA.y + CARD_H / 2) - (gB.y + CARD_H / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < TRANSFER_DIST && Math.random() < 0.003) {
              transferenciaRef.current = {
                idA: gA.id,
                idB: gB.id,
                progreso: 0,
                montoText: MONTOS[Math.floor(Math.random() * MONTOS.length)],
                coinX: gA.x + CARD_W / 2,
                coinY: gA.y + CARD_H / 2,
                activa: true,
              };
              break;
            }
          }
          if (transferenciaRef.current) break;
        }
      }

      // ── Avanzar transferencia ─────────────────────────────────────────────
      if (transferenciaRef.current) {
        transferenciaRef.current.progreso += 0.008;
        if (transferenciaRef.current.progreso >= 1) {
          transferenciaRef.current = null;
          cooldownRef.current = TRANSFER_COOLDOWN;
        } else {
          dibujarTransferencia(ctx, transferenciaRef.current, grupos);
        }
      }

      // ── Actualizar y dibujar grupos ───────────────────────────────────────
      grupos.forEach((g) => {
        // Pop-in
        g.escala = lerp(g.escala, g.escalaTarget, 0.08);

        // Rastro
        g.rastros.push({ x: g.x, y: g.y, alpha: 0.5 });
        if (g.rastros.length > MAX_RASTROS) g.rastros.shift();
        g.rastros.forEach((r) => { r.alpha *= 0.82; });

        // Ángulo suave según velocidad
        const targetAngulo = Math.atan2(g.vy, g.vx) * 0.04;
        g.angulo = lerp(g.angulo, targetAngulo, 0.05);

        // Mover
        g.x += g.vx;
        g.y += g.vy;

        // Rebote con variación de velocidad
        const topMargin = 75;
        if (g.x < 10) { g.x = 10; g.vx = Math.abs(g.vx) * (0.9 + Math.random() * 0.2); }
        if (g.x + CARD_W > W - 10) { g.x = W - 10 - CARD_W; g.vx = -Math.abs(g.vx) * (0.9 + Math.random() * 0.2); }
        if (g.y < topMargin) { g.y = topMargin; g.vy = Math.abs(g.vy) * (0.9 + Math.random() * 0.2); }
        if (g.y + CARD_H > H - 10) { g.y = H - 10 - CARD_H; g.vy = -Math.abs(g.vy) * (0.9 + Math.random() * 0.2); }

        // Velocidad máxima
        const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
        if (speed > 0.8) { g.vx *= 0.98; g.vy *= 0.98; }
        if (speed < 0.2) { g.vx *= 1.02; g.vy *= 1.02; }

        // Burbuja con typing
        g.timerBurbuja++;
        if (g.typingFrames > 0) {
          g.typingFrames--;
        }
        if (g.timerBurbuja >= BURBUJA_FRAMES) {
          g.timerBurbuja = 0;
          g.burbujaActual = (g.burbujaActual + 1) % g.burbujas.length;
          g.typingFrames = TYPING_FRAMES;
        }

        dibujarGrupo(ctx, g, frame);
      });

      // ── Avión ─────────────────────────────────────────────────────────────
      const avion = avionRef.current;
      if (avion) {
        const ahora = Date.now();
        avion.progreso += 0.0018; // velocidad del avión

        if (avion.progreso >= 1) {
          // Llegó al otro extremo — limpiar estela vieja y reiniciar desde ese lado
          avion.estela = [];
          avion.ruta = generarRuta(W, H, !avion.ruta.direccionDerecha);
          avion.progreso = 0;
        } else {
          const { x0, y0, x1, y1, x2, y2, x3, y3 } = avion.ruta;
          const t = avion.progreso;
          const x = bezier(t, x0, x1, x2, x3);
          const y = bezier(t, y0, y1, y2, y3);

          // Agregar punto a la estela
          avion.estela.push({ x, y, creadoEn: ahora });

          // Limpiar puntos muy viejos (>2.5s para dar margen)
          avion.estela = avion.estela.filter(p => ahora - p.creadoEn < 2500);

          // Calcular ángulo de la tangente (derivada de la bezier)
          const dt = 0.01;
          const t2 = Math.min(t + dt, 1);
          const x2b = bezier(t2, x0, x1, x2, x3);
          const y2b = bezier(t2, y0, y1, y2, y3);
          const angulo = Math.atan2(y2b - y, x2b - x);

          // Dibujar estela primero (debajo del avión)
          dibujarEstela(ctx, avion.estela, ahora);

          // Dibujar avión
          dibujarAvion(ctx, x, y, angulo);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.88,
      }}
      aria-hidden="true"
    />
  );
}