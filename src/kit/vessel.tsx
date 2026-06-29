'use client';

/**
 * Vessel, the shared CONCRETE-scene primitive for "a quantity you can see filling
 * up": a glass container whose liquid level binds to a value, with optional objects
 * resting at the bottom (marbles, blocks, …) and an optional learner "reading" line.
 *
 * It exists so a lab can show the SAME quantity in two linked representations, the
 * abstract graph (see <PredictPlot>) and a physical thing rising in a beaker, which
 * is what makes a proportion/rate lesson click instead of reading as a table. Pure
 * SVG, --stage-* tokens, no hooks/defs/CSS-animation (motion, if any, is the caller's
 * `phase`), so it renders identically server/client and replays deterministically.
 *
 *   fillFrac   the TRUE liquid level (0..1 of the inner height), the ground truth.
 *   guessFrac  an optional dashed line = the learner's current reading; colour it by
 *              `guessTone` so it visibly snaps onto the surface when they get it right.
 *   objects    discrete items piled at the bottom (e.g. the marbles that displaced it).
 *
 * `Vessel` is self-contained (renders its own <svg>) so it drops in beside a graph;
 * `VesselGlyph` is the pure <g> for composing inside an existing stage scene.
 */

import type { ReactNode } from 'react';

const METAL = 'var(--stage-metal, #8a8a8a)';
const GLASS = 'color-mix(in oklab, var(--stage-fg) 26%, transparent)';
const FG = 'var(--stage-fg, #222)';
const MUTED = 'var(--stage-muted, #777)';

export type GuessTone = 'idle' | 'ok' | 'no';

const TONE_COLOR: Record<GuessTone, string> = {
  idle: 'var(--stage-accent)',
  ok: 'var(--stage-good)',
  no: 'var(--stage-warn)',
};

export interface VesselGlyphProps {
  /** top-left x,y and size of the vessel bounding box (px). */
  x: number; y: number; w: number; h: number;
  /** TRUE liquid level, 0..1 of the inner height. */
  fillFrac: number;
  /** liquid colour token. */
  color?: string;
  /** discrete objects piled at the bottom (count). */
  objects?: number;
  /** object colour token. */
  objectColor?: string;
  /** optional learner-reading dashed line, 0..1 of the inner height. */
  guessFrac?: number;
  /** colour the reading line by correctness. */
  guessTone?: GuessTone;
}

/** The pure <g> vessel, glass + liquid + objects + optional reading line. */
export function VesselGlyph({
  x, y, w, h, fillFrac, color = 'var(--stage-accent)', objects = 0,
  objectColor = '#e85aa6', guessFrac, guessTone = 'idle',
}: VesselGlyphProps): ReactNode {
  const lipH = 6;
  const wall = 3;
  const innerTop = y + lipH;
  const innerBot = y + h - 3;
  const innerH = innerBot - innerTop;
  const lx = x + wall;
  const rx = x + w - wall;
  const innerW = rx - lx;

  const liq = Math.max(0, Math.min(1, fillFrac));
  const liquidTop = innerBot - liq * innerH;

  // marbles piled at the bottom, deterministic close-packed-ish rows (no RNG → no
  // hydration drift). Sit them on the floor; they read as "what displaced the water".
  const cubes: ReactNode[] = [];
  if (objects > 0) {
    const r = Math.max(5, Math.min(11, innerW / 5.5));
    const perRow = Math.max(1, Math.floor((innerW - 4) / (r * 2)));
    for (let i = 0; i < objects; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const rowCount = Math.min(perRow, objects - row * perRow);
      const rowW = rowCount * r * 2;
      const x0 = (lx + rx) / 2 - rowW / 2 + r;
      const cxp = x0 + col * r * 2 + (row % 2) * (r * 0.5);
      const cyp = innerBot - r - row * r * 1.7;
      cubes.push(
        <g key={`o${i}`} style={{ animation: `vessel-drop 0.45s cubic-bezier(0.3,1.3,0.6,1) ${i * 0.08}s backwards` }}>
          <circle cx={cxp} cy={cyp} r={r} fill={objectColor} opacity={0.92} />
          <circle cx={cxp - r * 0.32} cy={cyp - r * 0.32} r={r * 0.3} fill="#fff" opacity={0.55} />
        </g>,
      );
    }
  }

  const gColor = TONE_COLOR[guessTone];
  const guessY = guessFrac != null ? innerBot - Math.max(0, Math.min(1, guessFrac)) * innerH : null;

  return (
    <g>
      {/* liquid body + meniscus (rises smoothly when the level changes) */}
      <rect x={lx} y={liquidTop} width={innerW} height={Math.max(0, innerBot - liquidTop)} fill={color} fillOpacity={0.4} style={{ transition: 'y 0.5s ease-out, height 0.5s ease-out' }} />
      {liq > 0.02 && <ellipse cx={(lx + rx) / 2} cy={liquidTop} rx={innerW / 2} ry={3.5} fill={color} fillOpacity={0.7} style={{ transition: 'cy 0.5s ease-out' }} />}
      {cubes}
      {/* glass walls (over the liquid edge) */}
      <path
        d={`M ${x} ${y} L ${lx} ${innerBot} L ${rx} ${innerBot} L ${x + w} ${y}`}
        fill="none" stroke={GLASS} strokeWidth={wall} strokeLinejoin="round" strokeLinecap="round"
      />
      {/* rim lip */}
      <line x1={x - 3} y1={y} x2={x + w + 3} y2={y} stroke={METAL} strokeWidth={3} strokeLinecap="round" />
      {/* learner reading line */}
      {guessY != null && (
        <g style={{ transition: 'transform 0.12s ease-out' }}>
          <line x1={x - 6} y1={guessY} x2={x + w + 6} y2={guessY} stroke={gColor} strokeWidth={2.5} strokeDasharray="6 4" />
          <circle cx={x + w + 6} cy={guessY} r={3.5} fill={gColor} />
        </g>
      )}
    </g>
  );
}

export interface VesselProps {
  width?: number;
  height?: number;
  /** TRUE liquid level, 0..1. */
  fillFrac: number;
  guessFrac?: number;
  guessTone?: GuessTone;
  objects?: number;
  liquidColor?: string;
  objectColor?: string;
  label?: string;
  /** draw a 0..max scale up the right side; pass the axis max + unit for readouts. */
  scaleMax?: number;
  scaleStep?: number;
  unit?: string;
}

/** Self-contained vessel (its own <svg>), drops in beside a graph as the concrete twin. */
export function Vessel({
  width = 150, height = 300, fillFrac, guessFrac, guessTone = 'idle', objects = 0,
  liquidColor = 'var(--stage-accent)', objectColor = '#e85aa6', label, scaleMax, scaleStep, unit,
}: VesselProps): ReactNode {
  const padL = scaleMax != null ? 4 : 8;
  const padR = scaleMax != null ? 34 : 8;
  const padTop = 10;
  const padBot = label ? 26 : 10;
  const vx = padL;
  const vw = width - padL - padR;
  const vy = padTop;
  const vh = height - padTop - padBot;

  // side scale ticks aligned to the inner liquid band (matches VesselGlyph geometry)
  const lipH = 6;
  const innerTop = vy + lipH;
  const innerBot = vy + vh - 3;
  const innerH = innerBot - innerTop;
  const ticks: ReactNode[] = [];
  if (scaleMax != null) {
    const step = scaleStep ?? scaleMax / 4;
    for (let v = 0; v <= scaleMax + 1e-6; v += step) {
      const ty = innerBot - (v / scaleMax) * innerH;
      ticks.push(
        <g key={`t${v}`}>
          <line x1={vx + vw} y1={ty} x2={vx + vw + 5} y2={ty} stroke={MUTED} strokeWidth={1.5} />
          <text x={vx + vw + 8} y={ty} fontSize={10} fill={MUTED} dominantBaseline="middle">{v}</text>
        </g>,
      );
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={label ? `${label}: liquid at ${(fillFrac * 100).toFixed(0)}% of full` : 'vessel'}>
      {ticks}
      <VesselGlyph
        x={vx} y={vy} w={vw} h={vh}
        fillFrac={fillFrac} color={liquidColor} objects={objects} objectColor={objectColor}
        guessFrac={guessFrac} guessTone={guessTone}
      />
      {unit && scaleMax != null && (
        <text x={vx + vw + 8} y={vy + 2} fontSize={9} fill={MUTED} dominantBaseline="hanging">{unit}</text>
      )}
      {label && <text x={width / 2} y={height - 8} fontSize={12} fontWeight={700} fill={FG} textAnchor="middle">{label}</text>}
      <style>{`@keyframes vessel-drop{from{transform:translateY(-34px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </svg>
  );
}
