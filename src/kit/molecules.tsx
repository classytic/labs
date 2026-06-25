'use client';

/**
 * MoleculeGlyph — the shared, tokenized molecule-icon vocabulary (single source
 * of truth) for every reaction visual: photosynthesis, respiration, and the
 * chemistry reaction labs. A pure SVG <g> centred at (x, y) within `size` px, so
 * it drops into a plain <svg> (ReactionFlow) or any host. Atom colours follow the
 * conventional CPK scheme but routed through --stage-* tokens so they retheme.
 *
 * Add a molecule by extending MOLECULES below — every reaction lab gains it for free.
 */

import type { ReactNode } from 'react';

export type MoleculeKind = 'co2' | 'h2o' | 'o2' | 'glucose' | 'atp' | 'light' | 'A' | 'B' | 'AB';

const O = 'var(--stage-danger)';                                       // oxygen — red
const C = 'color-mix(in oklab, var(--stage-fg) 44%, var(--stage-bg))'; // carbon — slate (visible on the dark canvas)
const H = 'color-mix(in oklab, var(--stage-fg) 84%, var(--stage-bg))'; // hydrogen — pale
const BOND = 'color-mix(in oklab, var(--stage-fg) 52%, transparent)';
const LIGHT = 'var(--stage-fg)';   // symbol on dark atoms
const DARK = 'var(--stage-bg)';    // symbol on pale atoms
const HALO = 'var(--stage-bg)';    // outline that separates overlapping atoms

// NOTE: every stroke uses vectorEffect="non-scaling-stroke" so the glyph's
// `scale(size/2)` transform doesn't magnify line widths into blobs — widths stay
// in px regardless of molSize.
function atom(cx: number, cy: number, r: number, fill: string, sym?: string, symColor: string = LIGHT): ReactNode {
  return (
    <g key={`${cx},${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={HALO} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      {sym && <text x={cx} y={cy} fill={symColor} fontSize={r * 1.15} fontWeight={800} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{sym}</text>}
    </g>
  );
}
const bond = (x1: number, y1: number, x2: number, y2: number): ReactNode => <line key={`b${x1},${y1},${x2},${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={BOND} strokeWidth={2.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />;

/** Each molecule draws into a unit box [-1,1]² (scaled by size/2); has a label. */
const MOLECULES: Record<MoleculeKind, { label: string; draw: () => ReactNode }> = {
  co2: { label: 'CO₂', draw: () => <g>{bond(-0.62, 0, 0, 0)}{bond(0, 0, 0.62, 0)}{atom(-0.66, 0, 0.34, O, 'O')}{atom(0, 0, 0.42, C, 'C')}{atom(0.66, 0, 0.34, O, 'O')}</g> },
  o2: { label: 'O₂', draw: () => <g>{bond(-0.42, 0, 0.42, 0)}{atom(-0.42, 0, 0.42, O, 'O')}{atom(0.42, 0, 0.42, O, 'O')}</g> },
  h2o: { label: 'H₂O', draw: () => <g>{bond(0, 0.12, -0.58, -0.42)}{bond(0, 0.12, 0.58, -0.42)}{atom(0, 0.12, 0.44, O, 'O')}{atom(-0.58, -0.42, 0.28, H, 'H', DARK)}{atom(0.58, -0.42, 0.28, H, 'H', DARK)}</g> },
  glucose: { label: 'glucose', draw: () => { const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return [Math.cos(a) * 0.66, Math.sin(a) * 0.66] as [number, number]; }); return <g><polygon points={pts.map((p) => p.join(',')).join(' ')} fill={`color-mix(in oklab, ${C} 22%, var(--stage-bg))`} stroke={BOND} strokeWidth={2.4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{pts.map((p) => atom(p[0], p[1], 0.13, C))}</g>; } },
  atp: { label: 'ATP', draw: () => <g><rect x={-0.74} y={-0.4} width={1.48} height={0.8} rx={0.4} fill="var(--stage-good)" stroke={HALO} strokeWidth={1.4} vectorEffect="non-scaling-stroke" /><text x={0} y={0.02} fill={DARK} fontSize={0.46} fontWeight={800} textAnchor="middle" dominantBaseline="central">ATP</text></g> },
  light: { label: 'light', draw: () => <g>{Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i; return <line key={i} x1={Math.cos(a) * 0.56} y1={Math.sin(a) * 0.56} x2={Math.cos(a) * 0.92} y2={Math.sin(a) * 0.92} stroke="var(--stage-warn)" strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />; })}<circle cx={0} cy={0} r={0.42} fill="var(--stage-warn)" stroke={HALO} strokeWidth={1.4} vectorEffect="non-scaling-stroke" /></g> },
  A: { label: 'A', draw: () => atom(0, 0, 0.66, 'var(--stage-accent)', 'A') },
  B: { label: 'B', draw: () => atom(0, 0, 0.66, 'var(--stage-accent-2)', 'B') },
  AB: { label: 'AB', draw: () => <g>{bond(-0.4, 0, 0.4, 0)}{atom(-0.44, 0, 0.46, 'var(--stage-accent)', 'A')}{atom(0.44, 0, 0.46, 'var(--stage-accent-2)', 'B')}</g> },
};

export const moleculeLabel = (kind: MoleculeKind): string => MOLECULES[kind].label;

export interface MoleculeGlyphProps {
  kind: MoleculeKind;
  x?: number;
  y?: number;
  size?: number;
  showLabel?: boolean;
}

/** A molecule icon as an SVG <g>, centred at (x,y), fitting a `size`-px box. */
export function MoleculeGlyph({ kind, x = 0, y = 0, size = 30, showLabel = false }: MoleculeGlyphProps): ReactNode {
  const m = MOLECULES[kind];
  const s = size / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${s})`} strokeLinecap="round">{m.draw()}</g>
      {showLabel && <text x={0} y={s + 12} fill="var(--stage-fg)" fontSize={11} fontWeight={600} textAnchor="middle">{m.label}</text>}
    </g>
  );
}
