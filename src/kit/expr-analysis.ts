/**
 * expr-analysis — the numeric/symbolic "solving" layer of the interactive-problem
 * engine, built on @classytic/stage's expr engine. Pure functions (no React) so a
 * creator's authored config can derive the quantities A-level questions ask for —
 * roots, intersections, tangents/normals, areas — without anyone hand-coding a lab.
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

/** Real roots of f on [a,b] via a sign-change scan refined by bisection. */
export function roots(f: Fn1, a: number, b: number, opts: { steps?: number; tol?: number } = {}): number[] {
  const steps = opts.steps ?? 1000;
  const tol = opts.tol ?? 1e-9;
  const grid = (b - a) / steps;
  const out: number[] = [];
  let xPrev = a;
  let fPrev = f(a);
  for (let i = 1; i <= steps; i++) {
    const x = a + grid * i;
    const fx = f(x);
    if (Number.isFinite(fPrev) && Number.isFinite(fx)) {
      if (fPrev === 0) pushUnique(out, xPrev, grid);
      else if (fPrev * fx < 0) {
        let lo = xPrev;
        let hi = x;
        let flo = fPrev;
        for (let k = 0; k < 80 && hi - lo > tol; k++) {
          const mid = (lo + hi) / 2;
          const fm = f(mid);
          if (!Number.isFinite(fm)) break;
          if (flo * fm <= 0) hi = mid;
          else { lo = mid; flo = fm; }
        }
        pushUnique(out, (lo + hi) / 2, grid);
      }
    }
    xPrev = x;
    fPrev = fx;
  }
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

/** Unsigned area between f and g over [a,b]. */
export function areaBetween(f: Fn1, g: Fn1, a: number, b: number, n = 1000): number {
  return Math.abs(integrate((x) => f(x) - g(x), a, b, n));
}
