'use client';

/**
 * Shared helpers for the per-component part modules. Each component lives in its own file
 * (cell.tsx, resistor.tsx, …) and owns its electrical stamp + glyph + tunables; these are the
 * only bits they have in common: terminal geometry for a 2-pin part, the rotate-aware render
 * wrapper, and small value formatters. Keeping them here means a component file is just "what
 * makes THIS part this part".
 */

import type { ReactNode } from 'react';
import type { Vec2 } from '@classytic/stage';
import type { PartInstance } from '../contract.js';

/** centre → terminal distance for a 2-terminal part, px. */
export const HALF = 30;

export const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
export const ohmLabel = (r: number): string => (r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`);
export const labelOf = (i: PartInstance): string | undefined => (i.props?.label as string) ?? undefined;

/** terminal world position for a 2-terminal part (a = left/top, b = right/bottom). */
export function term2(inst: PartInstance, pin: string): Vec2 {
  const { x, y } = inst.at, o = inst.orient ?? 'h', s = pin === 'a' ? -1 : 1;
  return o === 'v' ? { x, y: y + s * HALF } : { x: x + s * HALF, y };
}

/** render a 2-terminal glyph at the instance, rotated for 'v', label kept horizontal. */
export function render2(inst: PartInstance, label: string | undefined, glyph: (cx: number, cy: number, half: number, label?: string) => ReactNode): ReactNode {
  const { x, y } = inst.at, o = inst.orient ?? 'h';
  if (o === 'v') {
    return (
      <g key={inst.id}>
        <g transform={`rotate(90 ${x} ${y})`}>{glyph(x, y, HALF, undefined)}</g>
        {label && <text x={x + HALF + 8} y={y + 4} fill="var(--stage-fg)" fontSize={11} fontWeight={600} textAnchor="start" style={{ pointerEvents: 'none' }}>{label}</text>}
      </g>
    );
  }
  return <g key={inst.id}>{glyph(x, y, HALF, label)}</g>;
}
