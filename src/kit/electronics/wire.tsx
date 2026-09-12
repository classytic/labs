'use client';

/**
 * Wires + current flow — the shared loop drawing so labs stop re-deriving it:
 * `Wire` (a polyline net), `orthPoints`/`pointAlong` (routing + placement helpers),
 * `FlowDots` (conventional current as drifting dots), and `JunctionDot` (the
 * wires-connected marker). One wire model shared by the electronics + logic scenes.
 */

import type { ReactNode } from 'react';
import { LIVE, WIRE, METAL, SHEEN } from './_shared.js';

/**
 * JUNCTION DOT, the wire-junction marker: a filled node placed where wires meet to
 * show they are electrically connected (vs. a crossing). Not a two-terminal device;
 * energised junctions pick up the live colour.
 */
export function JunctionDot({
  x,
  y,
  r = 4,
  live,
  color,
}: {
  x: number;
  y: number;
  r?: number;
  live?: boolean;
  color?: string;
}): ReactNode {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={live ? (color ?? LIVE) : METAL} />
      <path
        d={`M ${x - r * 0.55} ${y - r * 0.55} A ${r} ${r} 0 0 1 ${x + r * 0.55} ${y - r * 0.55}`}
        fill="none"
        stroke={SHEEN}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </g>
  );
}

/** A thin, crisp wire polyline through pixel points; energised path picks up the live colour (or a
 *  per-net `color` override, so a scene can colour each signal so it stays traceable where wires cross). */
export function Wire({
  points,
  live,
  color,
}: {
  points: [number, number][];
  live?: boolean;
  color?: string;
}): ReactNode {
  return (
    <polyline
      points={points.map((p) => `${p[0]},${p[1]}`).join(' ')}
      fill="none"
      stroke={live ? (color ?? LIVE) : WIRE}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/** Orthogonal (right-angle) route from a left source to a right sink, as polyline points for
 *  `Wire`: straight when aligned, otherwise out to a mid-x, vertical, then in. One wire model
 *  shared by the electronics and logic scenes (no second wire primitive). */
export function orthPoints(a: { x: number; y: number }, b: { x: number; y: number }): [number, number][] {
  if (Math.abs(a.y - b.y) < 1.5)
    return [
      [a.x, a.y],
      [b.x, b.y],
    ];
  const midX = a.x + Math.max(14, (b.x - a.x) * 0.5);
  return [
    [a.x, a.y],
    [midX, a.y],
    [midX, b.y],
    [b.x, b.y],
  ];
}

function pathLength(points: [number, number][]): number {
  let t = 0;
  for (let i = 1; i < points.length; i++)
    t += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  return t;
}

/** Point a fraction t∈[0,1] along a pixel polyline (for placing current dots). */
export function pointAlong(points: [number, number][], t: number): [number, number] {
  if (points.length < 2) return points[0] ?? [0, 0];
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = (((t % 1) + 1) % 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]!) {
      const f = segs[i]! ? d / segs[i]! : 0;
      const a = points[i]!,
        b = points[i + 1]!;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    d -= segs[i]!;
  }
  return points[points.length - 1]!;
}

/**
 * Conventional current as clean, evenly-spaced dots drifting along a wire path.
 * Auto-spaces by arc length (one dot per ~`spacing` px) so it reads as flow, not
 * noise. `phase` (0..1) animates them.
 */
export function FlowDots({
  points,
  phase = 0,
  spacing = 60,
  r = 3.5,
}: {
  points: [number, number][];
  phase?: number;
  spacing?: number;
  r?: number;
}): ReactNode {
  const n = Math.max(3, Math.round(pathLength(points) / spacing));
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pointAlong(points, phase + i / n);
        return <circle key={i} cx={x} cy={y} r={r} fill={LIVE} />;
      })}
    </g>
  );
}
