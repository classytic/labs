'use client';

/**
 * Logic-gate glyph kit, the DIGITAL vocabulary (distinctive ANSI/IEEE gate
 * shapes + input switch + output LED), drawn in PIXEL space like the electronics
 * kit, tokenized, pure-SVG (no <defs>/<style>/hooks; "live" is a data prop the
 * host drives). Shared by discrete-math BooleanCircuit AND ICT boolean lessons.
 *
 * A gate fills a SQUARE box (x, y, size); inputs sit on the LEFT, the output on
 * the RIGHT (`gatePorts` gives the exact wire-attach points so the lab routes
 * wires without guessing). A `live` output picks up --stage-live.
 */

import type { ReactNode } from 'react';

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

const WIRE = 'var(--stage-wire)';
const LIVE = 'var(--stage-live)';
const METAL = 'var(--stage-metal)';
const BG = 'var(--stage-bg)';
const FG = 'var(--stage-fg)';
const SHEEN = 'color-mix(in oklab, var(--stage-sheen) 50%, transparent)';

const isNeg = (t: GateType): boolean => t === 'NAND' || t === 'NOR' || t === 'XNOR' || t === 'NOT';
const baseOf = (t: GateType): 'AND' | 'OR' | 'XOR' | 'NOT' => t === 'NAND' ? 'AND' : t === 'NOR' ? 'OR' : t === 'XNOR' ? 'XOR' : t === 'NOT' ? 'NOT' : t;

/** Wire-attach ports for a gate in box (x,y,size). 1 input for NOT, else 2. */
export function gatePorts(type: GateType, x: number, y: number, s: number): { inputs: { x: number; y: number }[]; output: { x: number; y: number } } {
  const single = type === 'NOT';
  const bub = isNeg(type) ? 0.16 * s : 0;
  const bodyRight = baseOf(type) === 'NOT' ? x + 0.7 * s : x + 0.86 * s;
  return {
    inputs: single ? [{ x, y: y + s / 2 }] : [{ x, y: y + 0.28 * s }, { x, y: y + 0.72 * s }],
    output: { x: bodyRight + bub, y: y + s / 2 },
  };
}

/** Where a small TYPE label (AND/OR/…) sits INSIDE the gate body: resolved per shape so it lands
 *  on the visual centroid (the D-body of AND, the right-shifted bulge of OR/XOR, the triangle of
 *  NOT) instead of overlapping an edge. */
export function gateLabelPos(type: GateType, x: number, y: number, s: number): { x: number; y: number } {
  const base = baseOf(type);
  const cy = y + s / 2;
  if (base === 'OR' || base === 'XOR') return { x: x + 0.46 * s, y: cy };
  if (base === 'NOT') return { x: x + 0.3 * s, y: cy };
  return { x: x + 0.38 * s, y: cy }; // AND / NAND D-body: shift well inside so 4-char names clear the left edge
}

/** A logic gate glyph. `live` = its OUTPUT is high. */
export function GateGlyph({ x, y, size: s, type, live, label }: { x: number; y: number; size: number; type: GateType; live?: boolean; label?: string }): ReactNode {
  const base = baseOf(type);
  // a live gate reads through a clean coloured OUTLINE + a faint body tint (no glow blob)
  const stroke = live ? LIVE : METAL;
  const fill = live ? 'color-mix(in oklab, var(--stage-live) 14%, var(--stage-bg))' : BG;
  const ports = gatePorts(type, x, y, s);
  const cy = y + s / 2;

  let body: ReactNode;
  if (base === 'AND') {
    body = <path d={`M${x},${y} H${x + 0.36 * s} A${0.5 * s},${0.5 * s} 0 0 1 ${x + 0.36 * s},${y + s} H${x} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  } else if (base === 'OR' || base === 'XOR') {
    const ox = base === 'XOR' ? x + 0.08 * s : x;
    body = <path d={`M${ox},${y} C${ox + 0.22 * s},${y + 0.16 * s} ${ox + 0.22 * s},${y + 0.84 * s} ${ox},${y + s} C${ox + 0.45 * s},${y + s} ${ox + 0.72 * s},${y + 0.82 * s} ${x + 0.86 * s},${cy} C${ox + 0.72 * s},${y + 0.18 * s} ${ox + 0.45 * s},${y} ${ox},${y} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  } else {
    body = <path d={`M${x + 0.06 * s},${y} L${x + 0.7 * s},${cy} L${x + 0.06 * s},${y + s} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  }

  return (
    <g>
      {/* XOR/XNOR extra back curve */}
      {base === 'XOR' && <path d={`M${x - 0.02 * s},${y} C${x + 0.2 * s},${y + 0.16 * s} ${x + 0.2 * s},${y + 0.84 * s} ${x - 0.02 * s},${y + s}`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
      {body}
      {/* negation bubble */}
      {isNeg(type) && <circle cx={ports.output.x - 0.08 * s} cy={cy} r={0.08 * s} fill={BG} stroke={stroke} strokeWidth={2} />}
      {/* output stub (picks up live) */}
      <line x1={ports.output.x} y1={cy} x2={ports.output.x + 0.14 * s} y2={cy} stroke={live ? LIVE : WIRE} strokeWidth={2.5} strokeLinecap="round" />
      {/* top sheen */}
      <path d={base === 'AND' ? `M${x + 0.04 * s},${y + 0.12 * s} H${x + 0.4 * s}` : `M${x + 0.1 * s},${y + 0.16 * s} q${0.2 * s},${0.04 * s} ${0.32 * s},${0.14 * s}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      {/* type name sits small INSIDE the body (centroid-resolved per shape), not on top */}
      {label && (() => { const lp = gateLabelPos(type, x, y, s); return <text x={lp.x} y={lp.y} fill={FG} fontSize={Math.max(7, s * 0.17)} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{label}</text>; })()}
    </g>
  );
}

/** An output LED: a clean filled disc (lit = `color`, idle = a faint outlined disc). No glow. */
export function Lamp({ cx, cy, r, on, color = LIVE, label }: { cx: number; cy: number; r: number; on?: boolean; color?: string; label?: string }): ReactNode {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={on ? color : 'color-mix(in oklab, var(--stage-metal) 14%, var(--stage-bg))'} stroke={on ? color : METAL} strokeWidth={1.5} />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.3} r={r * 0.28} fill={SHEEN} opacity={on ? 0.5 : 0.2} />
      {label && <text x={cx} y={cy + r + 5} fill={FG} fontSize={Math.max(8, r * 0.85)} fontWeight={700} textAnchor="middle" dominantBaseline="hanging" style={{ pointerEvents: 'none' }}>{label}</text>}
    </g>
  );
}

/** Which of segments a–g are lit for each hex digit 0–F (decoder truth, for a 7-seg display). */
const SEG_MAP: boolean[][] = [
  // a, b, c, d, e, f, g
  [1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1], [1, 0, 1, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1], [1, 1, 1, 0, 1, 1, 1], [0, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 1, 1, 1], [1, 0, 0, 0, 1, 1, 1],
].map((r) => r.map(Boolean));

export function digitSegments(value: number): boolean[] {
  return SEG_MAP[((value % 16) + 16) % 16]!;
}

/**
 * A seven-segment display digit. Drive it with a `value` (0–15 → 0–F) or explicit `segs`
 * (a..g booleans). Lit segments glow in the display colour; dark segments are a faint ghost,
 * so you read it like a real LED display. This is the output for binary/decoder/DLD labs.
 */
export function SevenSegment({ x, y, w = 46, h = 80, value, segs, color = 'var(--stage-warn)' }: { x: number; y: number; w?: number; h?: number; value?: number; segs?: boolean[]; color?: string }): ReactNode {
  const on = segs ?? (value !== undefined ? digitSegments(value) : [false, false, false, false, false, false, false]);
  const t = Math.min(w, h) * 0.13;        // segment thickness / inset
  const off = 'color-mix(in oklab, var(--stage-metal) 16%, transparent)';
  const seg = (key: string, lit: boolean | undefined, x1: number, y1: number, x2: number, y2: number): ReactNode => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lit ? color : off} strokeWidth={t} strokeLinecap="round" opacity={lit ? 1 : 0.55} />
  );
  const midY = y + h / 2;
  return (
    <g>
      <rect x={x - t} y={y - t} width={w + 2 * t} height={h + 2 * t} rx={6} fill="color-mix(in oklab, var(--stage-bg) 80%, var(--stage-metal))" stroke="var(--stage-grid)" strokeWidth={1} />
      {seg('a', on[0], x + t, y, x + w - t, y)}
      {seg('b', on[1], x + w, y + t, x + w, midY - t * 0.5)}
      {seg('c', on[2], x + w, midY + t * 0.5, x + w, y + h - t)}
      {seg('d', on[3], x + t, y + h, x + w - t, y + h)}
      {seg('e', on[4], x, midY + t * 0.5, x, y + h - t)}
      {seg('f', on[5], x, y + t, x, midY - t * 0.5)}
      {seg('g', on[6], x + t, midY, x + w - t, midY)}
    </g>
  );
}

/** An input switch (toggle). Render inside a `<g onClick>` in the lab for taps. */
export function ToggleSwitch({ x, y, w, h, on, label }: { x: number; y: number; w: number; h: number; on?: boolean; label?: string }): ReactNode {
  const r = h / 2;
  const knobX = on ? x + w - r : x + r;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={on ? 'color-mix(in oklab, var(--stage-live) 35%, transparent)' : 'color-mix(in oklab, var(--stage-metal) 18%, transparent)'} stroke={on ? LIVE : METAL} strokeWidth={1.5} />
      <circle cx={knobX} cy={y + r} r={r - 2.5} fill={BG} stroke={on ? LIVE : METAL} strokeWidth={1.5} />
      <circle cx={knobX - (r - 2.5) * 0.3} cy={y + r - (r - 2.5) * 0.3} r={(r - 2.5) * 0.34} fill={SHEEN} opacity={0.6} />
      {label && <text x={x + w / 2} y={y - 4} fill={FG} fontSize={Math.max(9, h * 0.7)} fontWeight={700} textAnchor="middle" dominantBaseline="auto" style={{ pointerEvents: 'none' }}>{label}</text>}
    </g>
  );
}
