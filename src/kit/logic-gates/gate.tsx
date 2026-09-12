'use client';

/**
 * Logic-gate glyphs, the distinctive ANSI/IEEE gate shapes drawn in PIXEL space,
 * tokenized, pure-SVG (no <defs>/<style>/hooks; "live" is a data prop the host
 * drives). A gate fills a SQUARE box (x, y, size); inputs on the LEFT, output on the
 * RIGHT (`gatePorts` gives the exact wire-attach points). Shared by discrete-math
 * BooleanCircuit and ICT boolean lessons.
 */

import type { ReactNode } from 'react';
import { WIRE, LIVE, METAL, BG, FG, SHEEN } from './_shared.js';

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

const isNeg = (t: GateType): boolean => t === 'NAND' || t === 'NOR' || t === 'XNOR' || t === 'NOT';
const baseOf = (t: GateType): 'AND' | 'OR' | 'XOR' | 'NOT' =>
  t === 'NAND' ? 'AND' : t === 'NOR' ? 'OR' : t === 'XNOR' ? 'XOR' : t === 'NOT' ? 'NOT' : t;

/** Wire-attach ports for a gate in box (x,y,size). 1 input for NOT, else 2. */
export function gatePorts(
  type: GateType,
  x: number,
  y: number,
  s: number,
): { inputs: { x: number; y: number }[]; output: { x: number; y: number } } {
  const single = type === 'NOT';
  const bub = isNeg(type) ? 0.16 * s : 0;
  const bodyRight = baseOf(type) === 'NOT' ? x + 0.7 * s : x + 0.86 * s;
  return {
    inputs: single
      ? [{ x, y: y + s / 2 }]
      : [
          { x, y: y + 0.28 * s },
          { x, y: y + 0.72 * s },
        ],
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
export function GateGlyph({
  x,
  y,
  size: s,
  type,
  live,
  label,
}: {
  x: number;
  y: number;
  size: number;
  type: GateType;
  live?: boolean;
  label?: string;
}): ReactNode {
  const base = baseOf(type);
  // a live gate reads through a clean coloured OUTLINE + a faint body tint (no glow blob)
  const stroke = live ? LIVE : METAL;
  const fill = live ? 'color-mix(in oklab, var(--stage-live) 14%, var(--stage-bg))' : BG;
  const ports = gatePorts(type, x, y, s);
  const cy = y + s / 2;

  let body: ReactNode;
  if (base === 'AND') {
    body = (
      <path
        d={`M${x},${y} H${x + 0.36 * s} A${0.5 * s},${0.5 * s} 0 0 1 ${x + 0.36 * s},${y + s} H${x} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    );
  } else if (base === 'OR' || base === 'XOR') {
    const ox = base === 'XOR' ? x + 0.08 * s : x;
    body = (
      <path
        d={`M${ox},${y} C${ox + 0.22 * s},${y + 0.16 * s} ${ox + 0.22 * s},${y + 0.84 * s} ${ox},${y + s} C${ox + 0.45 * s},${y + s} ${ox + 0.72 * s},${y + 0.82 * s} ${x + 0.86 * s},${cy} C${ox + 0.72 * s},${y + 0.18 * s} ${ox + 0.45 * s},${y} ${ox},${y} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    );
  } else {
    body = (
      <path
        d={`M${x + 0.06 * s},${y} L${x + 0.7 * s},${cy} L${x + 0.06 * s},${y + s} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    );
  }

  return (
    <g>
      {/* XOR/XNOR extra back curve */}
      {base === 'XOR' && (
        <path
          d={`M${x - 0.02 * s},${y} C${x + 0.2 * s},${y + 0.16 * s} ${x + 0.2 * s},${y + 0.84 * s} ${x - 0.02 * s},${y + s}`}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
      {body}
      {/* negation bubble */}
      {isNeg(type) && (
        <circle
          cx={ports.output.x - 0.08 * s}
          cy={cy}
          r={0.08 * s}
          fill={BG}
          stroke={stroke}
          strokeWidth={2}
        />
      )}
      {/* output stub (picks up live) */}
      <line
        x1={ports.output.x}
        y1={cy}
        x2={ports.output.x + 0.14 * s}
        y2={cy}
        stroke={live ? LIVE : WIRE}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Top sheen, kept well INSIDE the outline. It used to start on the OR back curve, where its
          light stroke cut a visible nick out of the gate's edge at every size. Each body gets its
          own line: the OR curve's highlight would sit outside a NOT triangle's sloping top. */}
      <path
        d={
          base === 'AND'
            ? `M${x + 0.12 * s},${y + 0.14 * s} H${x + 0.4 * s}`
            : base === 'NOT'
              ? `M${x + 0.14 * s},${y + 0.19 * s} L${x + 0.36 * s},${y + 0.36 * s}`
              : `M${x + 0.28 * s},${y + 0.14 * s} q${0.14 * s},${0.03 * s} ${0.28 * s},${0.13 * s}`
        }
        fill="none"
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* type name sits small INSIDE the body (centroid-resolved per shape), not on top */}
      {label &&
        (() => {
          const lp = gateLabelPos(type, x, y, s);
          return (
            <text
              x={lp.x}
              y={lp.y}
              fill={FG}
              fontSize={Math.max(7, s * 0.17)}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ pointerEvents: 'none' }}
            >
              {label}
            </text>
          );
        })()}
    </g>
  );
}
