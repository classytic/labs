import { Node } from "@classytic/stage";

//#region src/kit/expr-analysis.d.ts
type Fn1 = (x: number) => number;
/** A straight line y = m·x + c, with the point it was taken at and an evaluator. */
interface Line$1 {
  m: number;
  c: number;
  at: {
    x: number;
    y: number;
  };
  f: Fn1;
}
/**
 * Real roots of f on [a,b]. Two passes so it doesn't miss the roots students do:
 *   1. sign-change brackets refined by BISECTION (odd-multiplicity / crossings);
 *   2. local minima of |f| polished by NEWTON, accepted only if |f| really drops
 *      to ~0 — this recovers TANGENT / double roots (e.g. x² at 0) that never
 *      change sign. False minima (a parabola that never reaches 0) are rejected
 *      by the accept tolerance, so no phantom roots.
 */
declare function roots(f: Fn1, a: number, b: number, opts?: {
  steps?: number;
  tol?: number;
}): number[];
/** Points where f and g meet on [a,b]. */
declare function intersections(f: Fn1, g: Fn1, a: number, b: number, opts?: {
  steps?: number;
  tol?: number;
}): {
  x: number;
  y: number;
}[];
/** Exact tangent line to `ast` at x = x0 (params baked in via `scope`). */
declare function tangentAt(ast: Node, x0: number, varName?: string, params?: Record<string, number>): Line$1 | null;
/** Normal line to `ast` at x = x0 (⟂ the tangent). Null if the tangent is horizontal. */
declare function normalAt(ast: Node, x0: number, varName?: string, params?: Record<string, number>): Line$1 | null;
/** Composite-Simpson definite integral ∫_a^b f dx. */
declare function integrate(f: Fn1, a: number, b: number, n?: number): number;
/**
 * Geometric area between f and g over [a,b]. SPLITS at every crossing so the
 * pieces where g > f don't cancel the pieces where f > g (which a single
 * |∫(f−g)| would). Sums |∫| over each sub-interval — the area an exam actually
 * wants.
 */
declare function areaBetween(f: Fn1, g: Fn1, a: number, b: number, n?: number): number;
//#endregion
export { Fn1, Line$1 as Line, areaBetween, integrate, intersections, normalAt, roots, tangentAt };