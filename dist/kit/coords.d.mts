import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/kit/coords.d.ts
/** A straight line: either oblique/horizontal y = m·x + c, or vertical x = `vertical`. */
interface Lin {
  m: number;
  c: number;
  /** Set for a vertical line x = value (m is then ±∞). */
  vertical?: number;
}
/** The line through two points (vertical-safe). */
declare function lineThrough(a: Vec2, b: Vec2): Lin;
/** The line of gradient m through point p. */
declare function lineFrom(m: number, p: Vec2): Lin;
/** The line parallel to `l` through p (same gradient). */
declare function parallelThrough(l: Lin, p: Vec2): Lin;
/** The line perpendicular to `l` through p (gradient −1/m; verticals ↔ horizontals). */
declare function perpThrough(l: Lin, p: Vec2): Lin;
/** Where two lines cross (null if parallel). Vertical-safe. */
declare function intersectLines(l1: Lin, l2: Lin): Vec2 | null;
declare function distance(a: Vec2, b: Vec2): number;
declare function midpoint(a: Vec2, b: Vec2): Vec2;
/** Round to a clean string, trims trailing zeros; up to `dp` decimals. */
declare function num(n: number, dp?: number): string;
/** Human-readable equation of a line: "y = 2x − 3", "x = 4", "y = 5". */
declare function lineTex(l: Lin, dp?: number): string;
/** Intercept form "x/a + y/b = 1" for a line cutting the axes at (a,0),(0,b). */
declare function interceptTex(a: number, b: number, dp?: number): string;
/** Circle "(x − a)² + (y − b)² = r²" with centre (a,b). */
declare function circleTex(a: number, b: number, r: number, dp?: number): string;
/** Expanded circle x² + y² + Dx + Ey + F = 0 (the completing-the-square form). */
declare function circleExpandedTex(a: number, b: number, r: number, dp?: number): string;
/** Snap a value to the nearest `step` (0 → no snap). */
declare function snapTo(v: number, step?: number): number;
declare function snapPoint(p: Vec2, step?: number): Vec2;
interface CoordPlaneProps {
  view: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
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
declare function CoordPlane({
  view,
  height,
  ariaLabel,
  step,
  stepX,
  stepY,
  pad,
  labels,
  preserveAspect,
  children
}: CoordPlaneProps): ReactNode;
/** The rise/run right-triangle under a line segment, makes "gradient = Δy/Δx" visible. */
declare function GradientTriangle({
  a,
  b,
  color,
  showLabels
}: {
  a: Vec2;
  b: Vec2;
  color?: string;
  showLabels?: boolean;
}): ReactNode;
//#endregion
export { CoordPlane, CoordPlaneProps, GradientTriangle, Lin, circleExpandedTex, circleTex, distance, interceptTex, intersectLines, lineFrom, lineTex, lineThrough, midpoint, num, parallelThrough, perpThrough, snapPoint, snapTo };