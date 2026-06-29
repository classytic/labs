/**
 * expr-analysis, the numeric/symbolic "solving" layer of the interactive-problem
 * engine, built on @classytic/stage's expr engine. Pure functions (no React) so a
 * creator's authored config can derive the quantities A-level questions ask for , 
 * roots, intersections, tangents/normals, areas, without anyone hand-coding a lab.
 *
 * Everything works on a compiled scalar `Fn1 = (x) => number` (params already baked
 * into the closure) plus, for exact tangents, the parsed `Node` AST.
 */

import { differentiate, evaluate, type Node } from '@classytic/stage';

export type Fn1 = (x: number) => number;

/** A straight line y = m·x + c, with the point it was taken at and an evaluator. */
export interface Line {
  m: number;
  c: number;
  at: { x: number; y: number };
  f: Fn1;
}

function pushUnique(out: number[], x: number, tol: number): void {
  if (!out.some((p) => Math.abs(p - x) <= tol)) out.push(x);
}

/** Newton's method from x0 using a central-difference derivative (we only hold
 *  the numeric f, not its AST). Returns the polished root, or null on a flat
 *  derivative / divergence. Used to recover tangent (even-multiplicity) roots a
 *  sign-change scan can't see. */
function newton(f: Fn1, x0: number, tol: number): number | null {
  let x = x0;
  for (let k = 0; k < 40; k++) {
    const fx = f(x);
    if (!Number.isFinite(fx)) return null;
    if (Math.abs(fx) <= tol) return x;
    const h = Math.max(1e-7, Math.abs(x) * 1e-7);
    const d = (f(x + h) - f(x - h)) / (2 * h);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-13) return null; // flat → no Newton step
    const nx = x - fx / d;
    if (!Number.isFinite(nx)) return null;
    if (Math.abs(nx - x) <= tol) return nx;
    x = nx;
  }
  return Math.abs(f(x)) <= tol ? x : null;
}

/**
 * Real roots of f on [a,b]. Two passes so it doesn't miss the roots students do:
 *   1. sign-change brackets refined by BISECTION (odd-multiplicity / crossings);
 *   2. local minima of |f| polished by NEWTON, accepted only if |f| really drops
 *      to ~0 — this recovers TANGENT / double roots (e.g. x² at 0) that never
 *      change sign. False minima (a parabola that never reaches 0) are rejected
 *      by the accept tolerance, so no phantom roots.
 */
export function roots(f: Fn1, a: number, b: number, opts: { steps?: number; tol?: number } = {}): number[] {
  const steps = opts.steps ?? 1000;
  const tol = opts.tol ?? 1e-9;
  const grid = (b - a) / steps;
  const out: number[] = [];

  const xs: number[] = [], fs: number[] = [];
  for (let i = 0; i <= steps; i++) { const x = a + grid * i; xs.push(x); fs.push(f(x)); }
  let maxAbs = 0;
  for (const v of fs) if (Number.isFinite(v)) maxAbs = Math.max(maxAbs, Math.abs(v));
  const acceptTol = 1e-7 * (1 + maxAbs); // a polished |f| this small counts as a root

  // pass 1, sign changes → bisection
  for (let i = 1; i <= steps; i++) {
    const fPrev = fs[i - 1]!, fx = fs[i]!;
    if (!Number.isFinite(fPrev) || !Number.isFinite(fx)) continue;
    if (fPrev === 0) { pushUnique(out, xs[i - 1]!, grid); continue; }
    if (fPrev * fx < 0) {
      let lo = xs[i - 1]!, hi = xs[i]!, flo = fPrev;
      for (let k = 0; k < 80 && hi - lo > tol; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (!Number.isFinite(fm)) break;
        if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
      }
      pushUnique(out, (lo + hi) / 2, grid);
    }
  }
  // pass 2, tangent / even-multiplicity roots at local minima of |f|
  for (let i = 1; i < steps; i++) {
    const p = fs[i - 1]!, c = fs[i]!, q = fs[i + 1]!;
    if (!Number.isFinite(p) || !Number.isFinite(c) || !Number.isFinite(q)) continue;
    if (Math.abs(c) <= Math.abs(p) && Math.abs(c) <= Math.abs(q) && Math.abs(c) < 0.05 * (1 + maxAbs)) {
      const r = newton(f, xs[i]!, tol);
      if (r != null && r >= a - grid && r <= b + grid && Math.abs(f(r)) <= acceptTol) pushUnique(out, r, grid);
    }
  }
  out.sort((u, v) => u - v);
  return out;
}

/** Points where f and g meet on [a,b]. */
export function intersections(f: Fn1, g: Fn1, a: number, b: number, opts?: { steps?: number; tol?: number }): { x: number; y: number }[] {
  return roots((x) => f(x) - g(x), a, b, opts).map((x) => ({ x, y: f(x) }));
}

/** Exact tangent line to `ast` at x = x0 (params baked in via `scope`). */
export function tangentAt(ast: Node, x0: number, varName = 'x', params: Record<string, number> = {}): Line | null {
  const d = differentiate(ast, varName);
  if (!d) return null;
  const m = evaluate(d, { ...params, [varName]: x0 });
  const y0 = evaluate(ast, { ...params, [varName]: x0 });
  if (!Number.isFinite(m) || !Number.isFinite(y0)) return null;
  const c = y0 - m * x0;
  return { m, c, at: { x: x0, y: y0 }, f: (x) => m * x + c };
}

/** Normal line to `ast` at x = x0 (⟂ the tangent). Null if the tangent is horizontal. */
export function normalAt(ast: Node, x0: number, varName = 'x', params: Record<string, number> = {}): Line | null {
  const t = tangentAt(ast, x0, varName, params);
  if (!t || t.m === 0) return null;
  const m = -1 / t.m;
  const c = t.at.y - m * t.at.x;
  return { m, c, at: t.at, f: (x) => m * x + c };
}

/** Composite-Simpson definite integral ∫_a^b f dx. */
export function integrate(f: Fn1, a: number, b: number, n = 1000): number {
  if (a === b) return 0;
  let N = Math.max(2, Math.round(n));
  if (N % 2) N++;
  const h = (b - a) / N;
  let s = f(a) + f(b);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (h / 3) * s;
}

/**
 * Geometric area between f and g over [a,b]. SPLITS at every crossing so the
 * pieces where g > f don't cancel the pieces where f > g (which a single
 * |∫(f−g)| would). Sums |∫| over each sub-interval — the area an exam actually
 * wants.
 */
export function areaBetween(f: Fn1, g: Fn1, a: number, b: number, n = 1000): number {
  const d = (x: number): number => f(x) - g(x);
  const xs = roots(d, a, b).filter((x) => x > a + 1e-9 && x < b - 1e-9).sort((u, v) => u - v);
  const cuts = [a, ...xs, b];
  const per = Math.max(20, Math.round(n / Math.max(1, cuts.length - 1)));
  let area = 0;
  for (let i = 0; i < cuts.length - 1; i++) area += Math.abs(integrate(d, cuts[i]!, cuts[i + 1]!, per));
  return area;
}
