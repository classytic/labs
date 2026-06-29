'use client';

/**
 * Coordinate-geometry kit, the shared, DRY foundation for every "lines & curves
 * on the (x, y) plane" lab (straight lines, circles, conics). It packages the
 * boilerplate the older geometry labs each re-implemented by hand:
 *
 *   • <CoordPlane>    , a <Stage> + <Grid> + <Axes> framed plane, with EQUAL
 *                        scaling on by default so circles stay round and a
 *                        perpendicular actually looks 90°. (Function plots that
 *                        want a stretched y can pass preserveAspect={false}.)
 *   • pure helpers    , lineThrough / parallelThrough / perpThrough / distance /
 *                        midpoint, and the equation→string formatters (lineTex,
 *                        interceptTex, circleTex) every readout needs.
 *   • <GradientTriangle>, the rise/run right-triangle that makes "gradient" mean
 *                        something you can see.
 *
 * Render the components INSIDE a <CoordPlane> (they use the stage coordinate
 * context). Everything here is domain-neutral coordinate geometry, the actual
 * pedagogy (which question, what's draggable, the checked answer) lives in the
 * presets that compose this.
 */

import type { ReactNode } from 'react';
import { Stage, Grid, Axes, Segment, Label, type Vec2 } from '@classytic/stage';

// ── pure geometry ────────────────────────────────────────────────────────────

/** A straight line: either oblique/horizontal y = m·x + c, or vertical x = `vertical`. */
export interface Lin {
  m: number;
  c: number;
  /** Set for a vertical line x = value (m is then ±∞). */
  vertical?: number;
}

const EPS = 1e-9;

/** The line through two points (vertical-safe). */
export function lineThrough(a: Vec2, b: Vec2): Lin {
  if (Math.abs(b.x - a.x) < EPS) return { m: Infinity, c: NaN, vertical: a.x };
  const m = (b.y - a.y) / (b.x - a.x);
  return { m, c: a.y - m * a.x };
}

/** y on a line at x (NaN for a vertical line). */
export function yAt(l: Lin, x: number): number {
  return l.vertical !== undefined ? NaN : l.m * x + l.c;
}

/** The line of gradient m through point p. */
export function lineFrom(m: number, p: Vec2): Lin {
  return { m, c: p.y - m * p.x };
}

/** The line parallel to `l` through p (same gradient). */
export function parallelThrough(l: Lin, p: Vec2): Lin {
  if (l.vertical !== undefined) return { m: Infinity, c: NaN, vertical: p.x };
  return lineFrom(l.m, p);
}

/** The line perpendicular to `l` through p (gradient −1/m; verticals ↔ horizontals). */
export function perpThrough(l: Lin, p: Vec2): Lin {
  if (l.vertical !== undefined) return lineFrom(0, p); // ⊥ to vertical is horizontal
  if (Math.abs(l.m) < EPS) return { m: Infinity, c: NaN, vertical: p.x }; // ⊥ to horizontal is vertical
  return lineFrom(-1 / l.m, p);
}

/** Where two lines cross (null if parallel). Vertical-safe. */
export function intersectLines(l1: Lin, l2: Lin): Vec2 | null {
  if (l1.vertical !== undefined && l2.vertical !== undefined) return null;
  if (l1.vertical !== undefined) return { x: l1.vertical, y: yAt(l2, l1.vertical) };
  if (l2.vertical !== undefined) return { x: l2.vertical, y: yAt(l1, l2.vertical) };
  if (Math.abs(l1.m - l2.m) < EPS) return null;
  const x = (l2.c - l1.c) / (l1.m - l2.m);
  return { x, y: yAt(l1, x) };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Round to a clean string, trims trailing zeros; up to `dp` decimals. */
export function num(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '∞';
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return String(r);
}

/** "+ 3" / "− 3" (unicode minus), with an optional leading space. */
function signed(n: number, dp = 2): string {
  return `${n < 0 ? '−' : '+'} ${num(Math.abs(n), dp)}`;
}

/** A gradient coefficient: "x", "−x", "2x", "½x" … (no leading +/−1 noise). */
function coefX(m: number, dp = 2): string {
  if (Math.abs(m - 1) < EPS) return 'x';
  if (Math.abs(m + 1) < EPS) return '−x';
  return `${num(m, dp)}x`;
}

/** Human-readable equation of a line: "y = 2x − 3", "x = 4", "y = 5". */
export function lineTex(l: Lin, dp = 2): string {
  if (l.vertical !== undefined) return `x = ${num(l.vertical, dp)}`;
  if (Math.abs(l.m) < EPS) return `y = ${num(l.c, dp)}`;
  if (Math.abs(l.c) < EPS) return `y = ${coefX(l.m, dp)}`;
  return `y = ${coefX(l.m, dp)} ${signed(l.c, dp)}`;
}

/** Intercept form "x/a + y/b = 1" for a line cutting the axes at (a,0),(0,b). */
export function interceptTex(a: number, b: number, dp = 2): string {
  return `x/${num(a, dp)} + y/${num(b, dp)} = 1`;
}

/** Circle "(x − a)² + (y − b)² = r²" with centre (a,b). */
export function circleTex(a: number, b: number, r: number, dp = 2): string {
  const xs = Math.abs(a) < EPS ? 'x²' : `(x ${signed(-a, dp)})²`;
  const ys = Math.abs(b) < EPS ? 'y²' : `(y ${signed(-b, dp)})²`;
  return `${xs} + ${ys} = ${num(r * r, dp)}`;
}

/** Expanded circle x² + y² + Dx + Ey + F = 0 (the completing-the-square form). */
export function circleExpandedTex(a: number, b: number, r: number, dp = 2): string {
  const D = -2 * a, E = -2 * b, F = a * a + b * b - r * r;
  const dPart = Math.abs(D) < EPS ? '' : ` ${signed(D, dp)}x`.replace('+ ', '+ ').replace('− ', '− ');
  const ePart = Math.abs(E) < EPS ? '' : ` ${signed(E, dp)}y`;
  const fPart = Math.abs(F) < EPS ? '' : ` ${signed(F, dp)}`;
  return `x² + y²${dPart}${ePart}${fPart} = 0`;
}

/** Snap a value to the nearest `step` (0 → no snap). */
export function snapTo(v: number, step = 0): number {
  return step > 0 ? Math.round(v / step) * step : v;
}

export function snapPoint(p: Vec2, step = 0): Vec2 {
  return { x: snapTo(p.x, step), y: snapTo(p.y, step) };
}

// ── components ───────────────────────────────────────────────────────────────

export interface CoordPlaneProps {
  view: { xMin: number; xMax: number; yMin: number; yMax: number };
  height?: number;
  ariaLabel?: string;
  /** Grid/axis tick spacing in math units (default: auto via niceStep). */
  step?: number;
  /** Per-axis tick spacing overrides (for tall-thin / short-wide plots). */
  stepX?: number;
  stepY?: number;
  /** Inner padding in px, room for axis labels so they are not clipped at the edge. */
  pad?: number;
  /** Show numeric labels on the axes (default true). */
  labels?: boolean;
  /**
   * Equal x/y scaling. ON by default, geometry (circles, perpendiculars, angles)
   * needs it. Function plots that want a stretched y pass false.
   */
  preserveAspect?: boolean;
  children?: ReactNode;
}

/** The framed coordinate plane every coord-geometry lab draws on. */
export function CoordPlane({
  view, height = 360, ariaLabel, step, stepX, stepY, pad, labels = true, preserveAspect = true, children,
}: CoordPlaneProps): ReactNode {
  // labelled plots need room on the left/bottom or the numbers clip at the edge.
  const innerPad = pad ?? (labels ? 26 : 12);
  return (
    <Stage view={view} height={height} pad={innerPad} preserveAspect={preserveAspect} ariaLabel={ariaLabel}>
      <Grid step={step} stepX={stepX} stepY={stepY} />
      <Axes ticks step={step} stepX={stepX} stepY={stepY} labels={labels} />
      {children}
    </Stage>
  );
}

/** The rise/run right-triangle under a line segment, makes "gradient = Δy/Δx" visible. */
export function GradientTriangle({
  a, b, color = 'var(--stage-muted)', showLabels = true,
}: { a: Vec2; b: Vec2; color?: string; showLabels?: boolean }): ReactNode {
  const corner: Vec2 = { x: b.x, y: a.y }; // right angle at the corner under b, level with a
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (
    <>
      <Segment from={a} to={corner} color={color} weight={1.5} dashed />
      <Segment from={corner} to={b} color={color} weight={1.5} dashed />
      {showLabels && (
        <>
          <Label x={(a.x + corner.x) / 2} y={a.y} text={`Δx = ${num(dx)}`} color={color} size={11} dy={dy >= 0 ? 14 : -8} />
          <Label x={corner.x} y={(corner.y + b.y) / 2} text={`Δy = ${num(dy)}`} color={color} size={11} dx={dx >= 0 ? 8 : -8} anchor={dx >= 0 ? 'start' : 'end'} />
        </>
      )}
    </>
  );
}
