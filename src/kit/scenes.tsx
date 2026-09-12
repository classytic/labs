'use client';

/**
 * Quantity scenes, a REGISTRY of universal "concrete twins": reusable assets that render
 * a quantity as something you can see, so a lab is not welded to one analogy. The marble
 * beaker was just ONE scene; here a creator picks from many (a battery charging, a jar
 * filling, a pie, a balloon inflating, a grid, a coin stack…) and a NEW one is a single
 * function. Every lab that has "a level 0..1" or "a count" can bind to any of these.
 *
 *   level scenes  read `frac` (0..1), optional `guessFrac` reading line → vessel, tank,
 *                 bar, battery, jar, pie, balloon, thermometer, …
 *   count scenes  read `count` (+ `highlight`) → cluster, grid, coins, blocks, …
 *
 * Pure SVG, --stage-* tokens, self-contained (own <svg>), deterministic. The registry is
 * open: `registerScene(...)` to add your own; `listScenes('level')` to offer them in a
 * picker. This is the "author controls it" layer, not another hard-coded example.
 */

import type { ReactNode } from 'react';
import { Vessel, type GuessTone } from './vessel.js';
import { DotCluster } from './cluster.js';
import { ThermometerGlyph } from './thermal.js';

export interface QuantityInput {
  /** 0..1 fill level (level scenes). */
  frac?: number;
  /** discrete count (count scenes). */
  count?: number;
  /** newly-added items to light up (count scenes). */
  highlight?: number;
  /** optional learner reading line, 0..1 (level scenes). */
  guessFrac?: number;
  guessTone?: GuessTone;
  color?: string;
  label?: string;
  width?: number;
  height?: number;
}

export type QuantityScene = (q: QuantityInput) => ReactNode;
export interface SceneMeta {
  name: string;
  kind: 'level' | 'count';
  label: string;
  render: QuantityScene;
}

const REGISTRY = new Map<string, SceneMeta>();
export function registerScene(meta: SceneMeta): void {
  REGISTRY.set(meta.name, meta);
}
export function getScene(name: string): SceneMeta | undefined {
  return REGISTRY.get(name);
}
export function listScenes(kind?: 'level' | 'count'): SceneMeta[] {
  return [...REGISTRY.values()].filter((m) => !kind || m.kind === kind);
}

const TONE: Record<GuessTone, string> = {
  idle: 'var(--stage-accent)',
  ok: 'var(--stage-good)',
  no: 'var(--stage-warn)',
};
const FG = 'var(--stage-fg)';
const MUTED = 'var(--stage-muted)';
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** wrap a set of <g> children in a labelled, sized svg (the common scene shell). */
function Frame({
  w,
  h,
  label,
  aria,
  children,
}: {
  w: number;
  h: number;
  label?: string;
  aria: string;
  children: ReactNode;
}): ReactNode {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria}>
      {children}
      {label && (
        <text x={w / 2} y={h - 6} fontSize={12} fontWeight={700} fill={FG} textAnchor="middle">
          {label}
        </text>
      )}
    </svg>
  );
}

/** a dashed guess-reading line across a level scene at fraction `g` of the band [top,bot]. */
function GuessLine({
  x0,
  x1,
  top,
  bot,
  g,
  tone,
}: {
  x0: number;
  x1: number;
  top: number;
  bot: number;
  g?: number;
  tone: GuessTone;
}): ReactNode {
  if (g == null) return null;
  const y = bot - clamp01(g) * (bot - top);
  return (
    <g style={{ transition: 'transform 0.12s ease-out' }}>
      <line
        x1={x0 - 5}
        y1={y}
        x2={x1 + 5}
        y2={y}
        stroke={TONE[tone]}
        strokeWidth={2.4}
        strokeDasharray="6 4"
      />
      <circle cx={x1 + 5} cy={y} r={3.4} fill={TONE[tone]} />
    </g>
  );
}

const trans = { transition: 'y 0.5s ease-out, height 0.5s ease-out' } as const;

// ── modern glyph helpers ────────────────────────────────────────────────────
// Soft, token-tinted rims (never a harsh dark outline) + cylinder volume, so the
// flat scenes read as considered objects, matching the balloon/coins craft.
const RIM = 'color-mix(in oklab, var(--stage-fg) 14%, transparent)'; // soft border
const RIM_STRONG = 'color-mix(in oklab, var(--stage-fg) 24%, transparent)'; // caps/terminals
const GLASS = 'color-mix(in oklab, var(--stage-fg) 5%, transparent)'; // empty container surface
const SHEEN = 'var(--stage-sheen)';

/**
 * A vertical fill with cylinder-like volume: a left highlight stripe + a right
 * shade band + a top gloss over the base colour. Turns a flat swatch into a
 * rounded, lit object. `animate` wires the fill-level transition.
 */
function VolumeFillV({
  x,
  y,
  w,
  h,
  rx,
  color,
  animate = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  color: string;
  animate?: boolean;
}): ReactNode {
  if (h <= 0.5) return null;
  const s = animate ? trans : undefined;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={color} style={s} />
      <rect
        x={x}
        y={y}
        width={Math.max(3, w * 0.3)}
        height={h}
        rx={rx}
        fill={SHEEN}
        opacity={0.22}
        style={s}
      />
      <rect x={x + w * 0.72} y={y} width={w * 0.28} height={h} rx={rx} fill="#000" opacity={0.09} style={s} />
      <rect x={x} y={y} width={w} height={Math.min(7, h)} rx={rx} fill={SHEEN} opacity={0.18} style={s} />
    </g>
  );
}

// ── level scenes ──────────────────────────────────────────────────────────────

registerScene({
  name: 'vessel',
  kind: 'level',
  label: 'Beaker',
  render: (q) => (
    <Vessel
      width={q.width ?? 120}
      height={q.height ?? 150}
      fillFrac={q.frac ?? 0}
      guessFrac={q.guessFrac}
      guessTone={q.guessTone}
      liquidColor={q.color ?? 'var(--stage-accent)'}
      label={q.label}
    />
  ),
});

registerScene({
  name: 'tank',
  kind: 'level',
  label: 'Tank',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const bw = Math.min(w - 16, 84),
      bx = (w - bw) / 2;
    const top = 14,
      bot = h - (q.label ? 28 : 12),
      ry = bw * 0.16;
    const f = clamp01(q.frac ?? 0);
    const liqTop = bot - f * (bot - top);
    const c = q.color ?? 'var(--stage-accent)';
    const bodyPath = `M ${bx} ${top} L ${bx} ${bot} A ${bw / 2} ${ry} 0 0 0 ${bx + bw} ${bot} L ${bx + bw} ${top}`;
    return (
      <Frame w={w} h={h} label={q.label} aria={`tank ${(f * 100) | 0}% full`}>
        <path d={`${bodyPath} A ${bw / 2} ${ry} 0 0 0 ${bx} ${top}`} fill={GLASS} />
        <rect
          x={bx}
          y={liqTop}
          width={bw}
          height={Math.max(0, bot - liqTop)}
          fill={c}
          fillOpacity={0.5}
          style={trans}
        />
        <rect
          x={bx}
          y={liqTop}
          width={Math.max(3, bw * 0.26)}
          height={Math.max(0, bot - liqTop)}
          fill={SHEEN}
          opacity={0.2}
          style={trans}
        />
        {f > 0.02 && (
          <ellipse
            cx={bx + bw / 2}
            cy={liqTop}
            rx={bw / 2}
            ry={ry}
            fill={c}
            fillOpacity={0.85}
            style={{ transition: 'cy 0.5s ease-out' }}
          />
        )}
        <ellipse cx={bx + bw / 2} cy={top} rx={bw / 2} ry={ry} fill="none" stroke={RIM} strokeWidth={1.5} />
        <path
          d={`M ${bx} ${top} L ${bx} ${bot} M ${bx + bw} ${top} L ${bx + bw} ${bot}`}
          stroke={RIM}
          strokeWidth={1.5}
        />
        <path
          d={`M ${bx} ${bot} A ${bw / 2} ${ry} 0 0 0 ${bx + bw} ${bot}`}
          fill="none"
          stroke={RIM}
          strokeWidth={1.5}
        />
        <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
      </Frame>
    );
  },
});

registerScene({
  name: 'bar',
  kind: 'level',
  label: 'Bar',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const bw = 46,
      bx = (w - bw) / 2;
    const top = 12,
      bot = h - (q.label ? 28 : 12);
    const f = clamp01(q.frac ?? 0);
    const fillTop = bot - f * (bot - top);
    const c = q.color ?? 'var(--stage-accent)';
    return (
      <Frame w={w} h={h} label={q.label} aria={`bar at ${(f * 100) | 0}%`}>
        <rect
          x={bx}
          y={top}
          width={bw}
          height={bot - top}
          rx={13}
          fill={GLASS}
          stroke={RIM}
          strokeWidth={1.25}
        />
        <VolumeFillV x={bx + 2} y={fillTop} w={bw - 4} h={Math.max(0, bot - fillTop - 2)} rx={11} color={c} />
        <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
      </Frame>
    );
  },
});

registerScene({
  name: 'battery',
  kind: 'level',
  label: 'Battery',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const bw = 56,
      bx = (w - bw) / 2;
    const top = 22,
      bot = h - (q.label ? 28 : 12);
    const f = clamp01(q.frac ?? 0);
    const fillTop = bot - f * (bot - top);
    const c = f > 0.5 ? 'var(--stage-good)' : f > 0.2 ? 'var(--stage-warn)' : 'var(--stage-danger)';
    return (
      <Frame w={w} h={h} label={q.label} aria={`battery ${(f * 100) | 0}% charged`}>
        <rect x={bx + bw * 0.3} y={top - 7} width={bw * 0.4} height={8} rx={3} fill={RIM_STRONG} />
        <rect
          x={bx}
          y={top}
          width={bw}
          height={bot - top}
          rx={12}
          fill={GLASS}
          stroke={RIM}
          strokeWidth={1.5}
        />
        <VolumeFillV x={bx + 4} y={fillTop} w={bw - 8} h={Math.max(0, bot - fillTop - 4)} rx={8} color={c} />
        <text
          x={bx + bw / 2}
          y={(top + bot) / 2}
          fontSize={13}
          fontWeight={800}
          fill={FG}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ paintOrder: 'stroke', stroke: 'var(--stage-bg)', strokeWidth: 3 }}
        >
          {(f * 100) | 0}%
        </text>
      </Frame>
    );
  },
});

registerScene({
  name: 'jar',
  kind: 'level',
  label: 'Money jar',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const bw = Math.min(w - 18, 80),
      bx = (w - bw) / 2;
    const top = 24,
      bot = h - (q.label ? 28 : 12);
    const f = clamp01(q.frac ?? 0);
    const liqTop = bot - f * (bot - top);
    const c = q.color ?? '#f0b429';
    return (
      <Frame w={w} h={h} label={q.label} aria={`jar ${(f * 100) | 0}% full`}>
        <rect x={bx - 3} y={top - 9} width={bw + 6} height={9} rx={4} fill={RIM_STRONG} />
        <path
          d={`M ${bx} ${top} L ${bx} ${bot - 10} Q ${bx} ${bot} ${bx + 10} ${bot} L ${bx + bw - 10} ${bot} Q ${bx + bw} ${bot} ${bx + bw} ${bot - 10} L ${bx + bw} ${top}`}
          fill={GLASS}
          stroke={RIM}
          strokeWidth={1.5}
        />
        <rect
          x={bx + 2}
          y={liqTop}
          width={bw - 4}
          height={Math.max(0, bot - liqTop - 2)}
          fill={c}
          fillOpacity={0.7}
          style={trans}
        />
        <rect
          x={bx + 2}
          y={liqTop}
          width={Math.max(3, (bw - 4) * 0.24)}
          height={Math.max(0, bot - liqTop - 2)}
          fill={SHEEN}
          opacity={0.22}
          style={trans}
        />
        {f > 0.06 && (
          <text
            x={bx + bw / 2}
            y={(liqTop + bot) / 2}
            fontSize={Math.min(20, bw * 0.4)}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            💰
          </text>
        )}
        <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
      </Frame>
    );
  },
});

registerScene({
  name: 'pie',
  kind: 'level',
  label: 'Pie',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const cx = w / 2,
      cy = (h - (q.label ? 22 : 8)) / 2 + 4;
    const r = Math.min(cx, cy) - 8;
    const f = clamp01(q.frac ?? 0);
    const c = q.color ?? 'var(--stage-accent)';
    const a = f * 2 * Math.PI;
    const ex = cx + r * Math.sin(a),
      ey = cy - r * Math.cos(a);
    const large = f > 0.5 ? 1 : 0;
    const d =
      f <= 0
        ? ''
        : f >= 1
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
          : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
    return (
      <Frame w={w} h={h} label={q.label} aria={`pie ${(f * 100) | 0}%`}>
        <circle cx={cx} cy={cy} r={r} fill={GLASS} stroke={RIM} strokeWidth={1.25} />
        {d && <path d={d} fill={c} />}
        <circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke="#000" strokeOpacity={0.1} strokeWidth={1} />
        <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.52} ry={r * 0.3} fill={SHEEN} opacity={0.18} />
        <text
          x={cx}
          y={cy}
          fontSize={13}
          fontWeight={800}
          fill={FG}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ paintOrder: 'stroke', stroke: 'var(--stage-bg)', strokeWidth: 3 }}
        >
          {(f * 100) | 0}%
        </text>
      </Frame>
    );
  },
});

registerScene({
  name: 'balloon',
  kind: 'level',
  label: 'Balloon',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const cx = w / 2;
    const f = clamp01(q.frac ?? 0);
    const maxR = Math.min(w, h - 30) / 2 - 4;
    const r = maxR * (0.32 + 0.68 * f);
    const cy = 12 + maxR;
    const c = q.color ?? 'var(--stage-cat-8)';
    const ry = r * 1.12;
    // Depth without <defs>: a darker base body, a lighter offset lobe (fake
    // radial light from the upper-left), a crisp sheen, a knot, and a string
    // that CURVES — the straight line read as a stick.
    return (
      <Frame w={w} h={h} label={q.label} aria={`balloon ${(f * 100) | 0}% inflated`}>
        <path
          d={`M ${cx} ${cy + ry + 5} q ${6 + r * 0.1} ${8} 0 ${16} q ${-(6 + r * 0.1)} ${8} 0 ${Math.max(4, maxR + 8 - ry)}`}
          fill="none"
          stroke={MUTED}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={r}
          ry={ry}
          fill={`color-mix(in oklab, ${c} 88%, black)`}
          style={{ transition: 'rx 0.4s ease-out, ry 0.4s ease-out' }}
        />
        <ellipse
          cx={cx - r * 0.1}
          cy={cy - ry * 0.12}
          rx={r * 0.86}
          ry={ry * 0.84}
          fill={`color-mix(in oklab, ${c} 88%, var(--stage-sheen))`}
          style={{ transition: 'rx 0.4s ease-out, ry 0.4s ease-out' }}
        />
        <ellipse
          cx={cx - r * 0.34}
          cy={cy - ry * 0.38}
          rx={r * 0.2}
          ry={ry * 0.26}
          fill="var(--stage-sheen)"
          opacity={0.55}
        />
        <path
          d={`M ${cx - 4.5} ${cy + ry - 1} L ${cx + 4.5} ${cy + ry - 1} L ${cx} ${cy + ry + 6} Z`}
          fill={`color-mix(in oklab, ${c} 75%, black)`}
        />
      </Frame>
    );
  },
});

registerScene({
  name: 'thermometer',
  kind: 'level',
  label: 'Thermometer',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const f = clamp01(q.frac ?? 0);
    return (
      <Frame w={w} h={h} label={q.label} aria={`thermometer ${(f * 100) | 0}%`}>
        <ThermometerGlyph cx={w / 2} top={12} h={h - (q.label ? 40 : 24)} frac={f} />
      </Frame>
    );
  },
});

// ── count scenes ──────────────────────────────────────────────────────────────

registerScene({
  name: 'cluster',
  kind: 'count',
  label: 'Crowd',
  render: (q) => (
    <DotCluster
      count={q.count ?? 0}
      highlight={q.highlight ?? 0}
      size={Math.min(q.width ?? 120, q.height ?? 130)}
      label={q.label}
      highlightColor={q.color ?? 'var(--stage-accent)'}
    />
  ),
});

registerScene({
  name: 'grid',
  kind: 'count',
  label: 'Grid',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 130;
    const n = Math.max(0, Math.round(q.count ?? 0));
    const cols = Math.ceil(Math.sqrt(Math.max(1, n)));
    const rows = Math.ceil(n / cols);
    const area = Math.min(w, h - (q.label ? 22 : 6)) - 6;
    const cell = area / Math.max(cols, rows);
    const ox = (w - cols * cell) / 2,
      oy = 4;
    const c = q.color ?? 'var(--stage-accent)';
    const hl = q.highlight ?? 0;
    const cells: ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols),
        col = i % cols;
      const isNew = i >= n - hl;
      const gx = ox + col * cell + 1.5,
        gy = oy + r * cell + 1.5,
        gs = cell - 3,
        grx = Math.min(5, gs * 0.26);
      cells.push(
        <g
          key={i}
          opacity={isNew ? 1 : 0.6}
          style={{ animation: `scene-pop 0.3s ease-out ${i * 0.03}s backwards` }}
        >
          <rect x={gx} y={gy} width={gs} height={gs} rx={grx} fill={c} />
          <rect x={gx} y={gy} width={gs} height={gs * 0.42} rx={grx} fill={SHEEN} opacity={0.22} />
        </g>,
      );
    }
    return (
      <Frame w={w} h={h} label={q.label} aria={`grid of ${n}`}>
        {cells}
      </Frame>
    );
  },
});

registerScene({
  name: 'coins',
  kind: 'count',
  label: 'Coin stack',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const n = Math.max(0, Math.round(q.count ?? 0));
    const cw = Math.min(58, w - 16);
    const cx = w / 2;
    const bot = h - (q.label ? 26 : 10);
    // A coin STACK reads best as ONE shaded gold cylinder — a curved front edge per
    // coin (separation arcs), a light→dark side shade, and a single lit top face —
    // NOT N overlapping discs (that blobs into a lumpy barrel). No jitter: a clean
    // straight stack with visible coin edges. (Technique: cylinder silhouette +
    // per-coin front-arc separators + gradient-style shading.)
    const ry = Math.min(9, cw * 0.16);
    const band = n > 0 ? Math.max(4, Math.min(8, (bot - 16 - ry) / n)) : 8;
    const gold = q.color ?? '#f6c945';
    const hi = `color-mix(in oklab, ${gold} 52%, var(--stage-sheen))`;
    const lo = `color-mix(in oklab, ${gold} 66%, #8a5a12)`;
    const edge = `color-mix(in oklab, ${gold} 50%, #7a4d12)`;
    const topY = bot - n * band;
    const left = cx - cw / 2,
      right = cx + cw / 2;
    const side = `M ${left} ${topY} L ${left} ${bot} A ${cw / 2} ${ry} 0 0 0 ${right} ${bot} L ${right} ${topY} A ${cw / 2} ${ry} 0 0 1 ${left} ${topY} Z`;
    const seps: ReactNode[] = [];
    for (let i = 1; i < n; i++) {
      const y = bot - i * band;
      seps.push(
        <path
          key={`s${i}`}
          d={`M ${left} ${y} A ${cw / 2} ${ry} 0 0 0 ${right} ${y}`}
          fill="none"
          stroke={edge}
          strokeWidth={1}
          opacity={0.5}
        />,
      );
    }
    return (
      <Frame w={w} h={h} label={q.label} aria={`stack of ${n} coins`}>
        {n > 0 && (
          <g style={{ animation: 'scene-drop 0.4s ease-out backwards' }}>
            <ellipse cx={cx} cy={bot + 2} rx={cw / 2} ry={ry * 0.7} fill="#000" opacity={0.08} />
            <path d={side} fill={gold} />
            <rect x={left} y={topY} width={cw * 0.26} height={n * band} fill={hi} opacity={0.5} />
            <rect
              x={right - cw * 0.24}
              y={topY}
              width={cw * 0.24}
              height={n * band}
              fill={lo}
              opacity={0.55}
            />
            {seps}
            <ellipse cx={cx} cy={topY} rx={cw / 2} ry={ry} fill={gold} stroke={edge} strokeWidth={1} />
            <ellipse
              cx={cx}
              cy={topY}
              rx={cw / 2 - 4}
              ry={Math.max(1, ry - 1.8)}
              fill="none"
              stroke={hi}
              strokeWidth={1}
              opacity={0.85}
            />
            <ellipse
              cx={cx - cw * 0.16}
              cy={topY - 1}
              rx={cw * 0.16}
              ry={ry * 0.32}
              fill="var(--stage-sheen)"
              opacity={0.6}
            />
          </g>
        )}
      </Frame>
    );
  },
});

registerScene({
  name: 'blocks',
  kind: 'count',
  label: 'Blocks',
  render: (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const n = Math.max(0, Math.round(q.count ?? 0));
    const per = Math.max(1, Math.min(5, Math.ceil(Math.sqrt(n))));
    const s = Math.min(26, (w - 16) / per);
    const bot = h - (q.label ? 26 : 10);
    const c = q.color ?? 'var(--stage-accent)';
    const blocks: ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / per),
        col = i % per;
      const rowCount = Math.min(per, n - row * per);
      const x0 = (w - rowCount * s) / 2;
      const bxp = x0 + col * s + 1,
        byp = bot - (row + 1) * s + 1,
        bs = s - 2;
      blocks.push(
        <g key={i} style={{ animation: `scene-drop 0.4s ease-out ${i * 0.05}s backwards` }}>
          <rect x={bxp} y={byp} width={bs} height={bs} rx={5} fill={c} />
          <rect x={bxp} y={byp} width={bs} height={bs * 0.4} rx={5} fill={SHEEN} opacity={0.24} />
          <rect x={bxp} y={byp} width={bs} height={bs} rx={5} fill="none" stroke={RIM} strokeWidth={1} />
        </g>,
      );
    }
    return (
      <Frame w={w} h={h} label={q.label} aria={`${n} blocks`}>
        {blocks}
      </Frame>
    );
  },
});
