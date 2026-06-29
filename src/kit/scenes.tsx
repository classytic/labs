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
export interface SceneMeta { name: string; kind: 'level' | 'count'; label: string; render: QuantityScene }

const REGISTRY = new Map<string, SceneMeta>();
export function registerScene(meta: SceneMeta): void { REGISTRY.set(meta.name, meta); }
export function getScene(name: string): SceneMeta | undefined { return REGISTRY.get(name); }
export function listScenes(kind?: 'level' | 'count'): SceneMeta[] {
  return [...REGISTRY.values()].filter((m) => !kind || m.kind === kind);
}

const TONE: Record<GuessTone, string> = { idle: 'var(--stage-accent)', ok: 'var(--stage-good)', no: 'var(--stage-warn)' };
const FG = 'var(--stage-fg)';
const MUTED = 'var(--stage-muted)';
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** wrap a set of <g> children in a labelled, sized svg (the common scene shell). */
function Frame({ w, h, label, aria, children }: { w: number; h: number; label?: string; aria: string; children: ReactNode }): ReactNode {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria}>
      {children}
      {label && <text x={w / 2} y={h - 6} fontSize={12} fontWeight={700} fill={FG} textAnchor="middle">{label}</text>}
    </svg>
  );
}

/** a dashed guess-reading line across a level scene at fraction `g` of the band [top,bot]. */
function GuessLine({ x0, x1, top, bot, g, tone }: { x0: number; x1: number; top: number; bot: number; g?: number; tone: GuessTone }): ReactNode {
  if (g == null) return null;
  const y = bot - clamp01(g) * (bot - top);
  return (
    <g style={{ transition: 'transform 0.12s ease-out' }}>
      <line x1={x0 - 5} y1={y} x2={x1 + 5} y2={y} stroke={TONE[tone]} strokeWidth={2.4} strokeDasharray="6 4" />
      <circle cx={x1 + 5} cy={y} r={3.4} fill={TONE[tone]} />
    </g>
  );
}

const trans = { transition: 'y 0.5s ease-out, height 0.5s ease-out' } as const;

// ── level scenes ──────────────────────────────────────────────────────────────

registerScene({ name: 'vessel', kind: 'level', label: 'Beaker', render: (q) =>
  <Vessel width={q.width ?? 120} height={q.height ?? 150} fillFrac={q.frac ?? 0} guessFrac={q.guessFrac} guessTone={q.guessTone} liquidColor={q.color ?? 'var(--stage-accent)'} label={q.label} /> });

registerScene({ name: 'tank', kind: 'level', label: 'Tank', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const bw = Math.min(w - 16, 84), bx = (w - bw) / 2;
  const top = 14, bot = h - (q.label ? 28 : 12), ry = bw * 0.16; const f = clamp01(q.frac ?? 0);
  const liqTop = bot - f * (bot - top); const c = q.color ?? '#3aa0ff';
  return <Frame w={w} h={h} label={q.label} aria={`tank ${(f * 100) | 0}% full`}>
    <rect x={bx} y={liqTop} width={bw} height={Math.max(0, bot - liqTop)} fill={c} fillOpacity={0.45} style={trans} />
    {f > 0.02 && <ellipse cx={bx + bw / 2} cy={liqTop} rx={bw / 2} ry={ry} fill={c} fillOpacity={0.8} style={{ transition: 'cy 0.5s ease-out' }} />}
    <ellipse cx={bx + bw / 2} cy={top} rx={bw / 2} ry={ry} fill="none" stroke={MUTED} strokeWidth={2} />
    <path d={`M ${bx} ${top} L ${bx} ${bot} M ${bx + bw} ${top} L ${bx + bw} ${bot}`} stroke={MUTED} strokeWidth={2} />
    <path d={`M ${bx} ${bot} A ${bw / 2} ${ry} 0 0 0 ${bx + bw} ${bot}`} fill="none" stroke={MUTED} strokeWidth={2} />
    <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
  </Frame>;
} });

registerScene({ name: 'bar', kind: 'level', label: 'Bar', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const bw = 44, bx = (w - bw) / 2;
  const top = 12, bot = h - (q.label ? 28 : 12); const f = clamp01(q.frac ?? 0);
  const fillTop = bot - f * (bot - top); const c = q.color ?? 'var(--stage-accent)';
  return <Frame w={w} h={h} label={q.label} aria={`bar at ${(f * 100) | 0}%`}>
    <rect x={bx} y={top} width={bw} height={bot - top} rx={10} fill="color-mix(in oklab, var(--stage-fg) 12%, transparent)" />
    <rect x={bx} y={fillTop} width={bw} height={Math.max(0, bot - fillTop)} rx={10} fill={c} style={trans} />
    <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
  </Frame>;
} });

registerScene({ name: 'battery', kind: 'level', label: 'Battery', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const bw = 56, bx = (w - bw) / 2;
  const top = 22, bot = h - (q.label ? 28 : 12); const f = clamp01(q.frac ?? 0);
  const fillTop = bot - f * (bot - top);
  const c = f > 0.5 ? 'var(--stage-good)' : f > 0.2 ? '#e0a020' : 'var(--stage-warn)';
  return <Frame w={w} h={h} label={q.label} aria={`battery ${(f * 100) | 0}% charged`}>
    <rect x={bx + bw * 0.3} y={top - 8} width={bw * 0.4} height={8} rx={2} fill={MUTED} />
    <rect x={bx} y={top} width={bw} height={bot - top} rx={8} fill="none" stroke={FG} strokeWidth={2.5} />
    <rect x={bx + 4} y={fillTop} width={bw - 8} height={Math.max(0, bot - fillTop - 3)} rx={4} fill={c} style={trans} />
    <text x={bx + bw / 2} y={(top + bot) / 2} fontSize={13} fontWeight={800} fill={FG} textAnchor="middle" dominantBaseline="middle">{(f * 100) | 0}%</text>
  </Frame>;
} });

registerScene({ name: 'jar', kind: 'level', label: 'Money jar', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const bw = Math.min(w - 18, 80), bx = (w - bw) / 2;
  const top = 24, bot = h - (q.label ? 28 : 12); const f = clamp01(q.frac ?? 0);
  const liqTop = bot - f * (bot - top); const c = q.color ?? '#f0b429';
  return <Frame w={w} h={h} label={q.label} aria={`jar ${(f * 100) | 0}% full`}>
    <rect x={bx - 3} y={top - 9} width={bw + 6} height={9} rx={3} fill={MUTED} />
    <path d={`M ${bx} ${top} L ${bx} ${bot - 10} Q ${bx} ${bot} ${bx + 10} ${bot} L ${bx + bw - 10} ${bot} Q ${bx + bw} ${bot} ${bx + bw} ${bot - 10} L ${bx + bw} ${top}`} fill="color-mix(in oklab, var(--stage-fg) 5%, transparent)" stroke={MUTED} strokeWidth={2} />
    <rect x={bx + 2} y={liqTop} width={bw - 4} height={Math.max(0, bot - liqTop - 2)} fill={c} fillOpacity={0.6} style={trans} />
    {f > 0.06 && <text x={bx + bw / 2} y={(liqTop + bot) / 2} fontSize={Math.min(20, bw * 0.4)} textAnchor="middle" dominantBaseline="middle">💰</text>}
    <GuessLine x0={bx} x1={bx + bw} top={top} bot={bot} g={q.guessFrac} tone={q.guessTone ?? 'idle'} />
  </Frame>;
} });

registerScene({ name: 'pie', kind: 'level', label: 'Pie', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const cx = w / 2, cy = (h - (q.label ? 22 : 8)) / 2 + 4;
  const r = Math.min(cx, cy) - 8; const f = clamp01(q.frac ?? 0); const c = q.color ?? 'var(--stage-accent)';
  const a = f * 2 * Math.PI; const ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a); const large = f > 0.5 ? 1 : 0;
  const d = f <= 0 ? '' : f >= 1 ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z` : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
  return <Frame w={w} h={h} label={q.label} aria={`pie ${(f * 100) | 0}%`}>
    <circle cx={cx} cy={cy} r={r} fill="color-mix(in oklab, var(--stage-fg) 10%, transparent)" stroke={MUTED} strokeWidth={1.5} />
    {d && <path d={d} fill={c} fillOpacity={0.85} />}
    <text x={cx} y={cy} fontSize={13} fontWeight={800} fill={FG} textAnchor="middle" dominantBaseline="middle" style={{ paintOrder: 'stroke', stroke: 'var(--stage-bg)', strokeWidth: 3 }}>{(f * 100) | 0}%</text>
  </Frame>;
} });

registerScene({ name: 'balloon', kind: 'level', label: 'Balloon', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const cx = w / 2; const f = clamp01(q.frac ?? 0);
  const maxR = Math.min(w, h - 30) / 2 - 4; const r = maxR * (0.32 + 0.68 * f); const cy = 12 + maxR;
  const c = q.color ?? '#e85aa6';
  return <Frame w={w} h={h} label={q.label} aria={`balloon ${(f * 100) | 0}% inflated`}>
    <line x1={cx} y1={cy + r} x2={cx} y2={cy + maxR + 18} stroke={MUTED} strokeWidth={1.5} />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.12} fill={c} fillOpacity={0.85} style={{ transition: 'rx 0.4s ease-out, ry 0.4s ease-out' }} />
    <ellipse cx={cx - r * 0.32} cy={cy - r * 0.4} rx={r * 0.18} ry={r * 0.26} fill="#fff" opacity={0.4} />
    <path d={`M ${cx - 4} ${cy + r} L ${cx + 4} ${cy + r} L ${cx} ${cy + r + 6} Z`} fill={c} />
  </Frame>;
} });

registerScene({ name: 'thermometer', kind: 'level', label: 'Thermometer', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const f = clamp01(q.frac ?? 0);
  return <Frame w={w} h={h} label={q.label} aria={`thermometer ${(f * 100) | 0}%`}>
    <ThermometerGlyph cx={w / 2} top={12} h={h - (q.label ? 40 : 24)} frac={f} />
  </Frame>;
} });

// ── count scenes ──────────────────────────────────────────────────────────────

registerScene({ name: 'cluster', kind: 'count', label: 'Crowd', render: (q) =>
  <DotCluster count={q.count ?? 0} highlight={q.highlight ?? 0} size={Math.min(q.width ?? 120, (q.height ?? 130))} label={q.label} highlightColor={q.color ?? 'var(--stage-accent)'} /> });

registerScene({ name: 'grid', kind: 'count', label: 'Grid', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 130; const n = Math.max(0, Math.round(q.count ?? 0));
  const cols = Math.ceil(Math.sqrt(Math.max(1, n))); const rows = Math.ceil(n / cols);
  const area = Math.min(w, h - (q.label ? 22 : 6)) - 6; const cell = area / Math.max(cols, rows);
  const ox = (w - cols * cell) / 2, oy = 4; const c = q.color ?? 'var(--stage-accent)'; const hl = q.highlight ?? 0;
  const cells: ReactNode[] = [];
  for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), col = i % cols; const isNew = i >= n - hl;
    cells.push(<rect key={i} x={ox + col * cell + 1.5} y={oy + r * cell + 1.5} width={cell - 3} height={cell - 3} rx={3} fill={c} opacity={isNew ? 0.95 : 0.6} style={{ animation: `scene-pop 0.3s ease-out ${i * 0.03}s backwards` }} />); }
  return <Frame w={w} h={h} label={q.label} aria={`grid of ${n}`}>{cells}<style>{`@keyframes scene-pop{from{opacity:0;transform:scale(0.4)}to{opacity:1}}`}</style></Frame>;
} });

registerScene({ name: 'coins', kind: 'count', label: 'Coin stack', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const n = Math.max(0, Math.round(q.count ?? 0));
  const cw = Math.min(54, w - 20); const cx = w / 2; const ch = 11; const bot = h - (q.label ? 26 : 10);
  const c = q.color ?? '#f0b429'; const coins: ReactNode[] = [];
  for (let i = 0; i < n; i++) { const cy = bot - i * (ch - 3) - ch;
    coins.push(<g key={i} style={{ animation: `scene-drop 0.4s ease-out ${i * 0.06}s backwards` }}>
      <ellipse cx={cx} cy={cy + ch} rx={cw / 2} ry={ch * 0.5} fill={`color-mix(in oklab, ${c} 70%, black)`} />
      <ellipse cx={cx} cy={cy} rx={cw / 2} ry={ch * 0.5} fill={c} stroke={`color-mix(in oklab, ${c} 60%, black)`} strokeWidth={1} />
    </g>); }
  return <Frame w={w} h={h} label={q.label} aria={`stack of ${n} coins`}>{coins}<style>{`@keyframes scene-drop{from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:translateY(0)}}`}</style></Frame>;
} });

registerScene({ name: 'blocks', kind: 'count', label: 'Blocks', render: (q) => {
  const w = q.width ?? 120, h = q.height ?? 150; const n = Math.max(0, Math.round(q.count ?? 0));
  const per = Math.max(1, Math.min(5, Math.ceil(Math.sqrt(n)))); const s = Math.min(26, (w - 16) / per);
  const bot = h - (q.label ? 26 : 10); const c = q.color ?? 'var(--stage-accent)'; const blocks: ReactNode[] = [];
  for (let i = 0; i < n; i++) { const row = Math.floor(i / per), col = i % per;
    const rowCount = Math.min(per, n - row * per); const x0 = (w - rowCount * s) / 2;
    blocks.push(<rect key={i} x={x0 + col * s + 1} y={bot - (row + 1) * s + 1} width={s - 2} height={s - 2} rx={3} fill={c} fillOpacity={0.85} stroke={`color-mix(in oklab, ${c} 55%, black)`} strokeWidth={1} style={{ animation: `scene-drop 0.4s ease-out ${i * 0.05}s backwards` }} />); }
  return <Frame w={w} h={h} label={q.label} aria={`${n} blocks`}>{blocks}<style>{`@keyframes scene-drop{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}`}</style></Frame>;
} });
