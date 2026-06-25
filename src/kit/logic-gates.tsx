'use client';

/**
 * Logic-gate glyph kit — the DIGITAL vocabulary (distinctive ANSI/IEEE gate
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

/** A logic gate glyph. `live` = its OUTPUT is high. */
export function GateGlyph({ x, y, size: s, type, live, label }: { x: number; y: number; size: number; type: GateType; live?: boolean; label?: string }): ReactNode {
  const base = baseOf(type);
  const stroke = METAL;
  const ports = gatePorts(type, x, y, s);
  const cy = y + s / 2;

  let body: ReactNode;
  if (base === 'AND') {
    body = <path d={`M${x},${y} H${x + 0.36 * s} A${0.5 * s},${0.5 * s} 0 0 1 ${x + 0.36 * s},${y + s} H${x} Z`} fill={BG} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  } else if (base === 'OR' || base === 'XOR') {
    const ox = base === 'XOR' ? x + 0.08 * s : x;
    body = <path d={`M${ox},${y} C${ox + 0.22 * s},${y + 0.16 * s} ${ox + 0.22 * s},${y + 0.84 * s} ${ox},${y + s} C${ox + 0.45 * s},${y + s} ${ox + 0.72 * s},${y + 0.82 * s} ${x + 0.86 * s},${cy} C${ox + 0.72 * s},${y + 0.18 * s} ${ox + 0.45 * s},${y} ${ox},${y} Z`} fill={BG} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  } else {
    body = <path d={`M${x + 0.06 * s},${y} L${x + 0.7 * s},${cy} L${x + 0.06 * s},${y + s} Z`} fill={BG} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
  }

  return (
    <g>
      {/* soft live halo, centred on the gate body */}
      {live && <circle cx={x + 0.46 * s} cy={cy} r={s * 0.62} fill={LIVE} opacity={0.12} />}
      {/* XOR/XNOR extra back curve */}
      {base === 'XOR' && <path d={`M${x - 0.02 * s},${y} C${x + 0.2 * s},${y + 0.16 * s} ${x + 0.2 * s},${y + 0.84 * s} ${x - 0.02 * s},${y + s}`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />}
      {body}
      {/* negation bubble */}
      {isNeg(type) && <circle cx={ports.output.x - 0.08 * s} cy={cy} r={0.08 * s} fill={BG} stroke={stroke} strokeWidth={2} />}
      {/* output stub (picks up live) */}
      <line x1={ports.output.x} y1={cy} x2={ports.output.x + 0.14 * s} y2={cy} stroke={live ? LIVE : WIRE} strokeWidth={2.5} strokeLinecap="round" />
      {/* top sheen */}
      <path d={base === 'AND' ? `M${x + 0.04 * s},${y + 0.12 * s} H${x + 0.4 * s}` : `M${x + 0.1 * s},${y + 0.16 * s} q${0.2 * s},${0.04 * s} ${0.32 * s},${0.14 * s}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
      {label && <text x={ports.output.x - (base === 'NOT' ? 0.42 : 0.5) * s} y={cy} fill={FG} fontSize={Math.max(8, s * 0.22)} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{label}</text>}
    </g>
  );
}

/** An output LED — glows `color` when on, with a soft halo + sheen; dim ring off. */
export function Lamp({ cx, cy, r, on, color = LIVE, label }: { cx: number; cy: number; r: number; on?: boolean; color?: string; label?: string }): ReactNode {
  const lit = color;
  return (
    <g>
      {on && <circle cx={cx} cy={cy} r={r * 2.1} fill={lit} opacity={0.18} />}
      {on && <circle cx={cx} cy={cy} r={r * 1.45} fill={lit} opacity={0.28} />}
      <circle cx={cx} cy={cy} r={r} fill={on ? lit : 'color-mix(in oklab, var(--stage-metal) 22%, transparent)'} stroke={on ? lit : METAL} strokeWidth={1.5} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.32} r={r * 0.34} fill={SHEEN} opacity={on ? 0.8 : 0.3} />
      {label && <text x={cx} y={cy + r + 4} fill={FG} fontSize={Math.max(8, r * 0.9)} fontWeight={700} textAnchor="middle" dominantBaseline="hanging" style={{ pointerEvents: 'none' }}>{label}</text>}
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
