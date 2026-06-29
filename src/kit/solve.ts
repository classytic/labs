/**
 * Symbolic polynomial solver, the EXACT companion to expr-analysis's numeric
 * roots(). It reads a parsed expression as a polynomial in x (collapsing the AST
 * to coefficients) and solves degree 1 and 2 in closed form — so a lab can show
 * "x = 2 or x = −2", with COMPLEX roots when the discriminant is negative (reusing
 * the complex kernel). Returns null when the expression isn't a low-degree
 * polynomial in x (sin(x), 1/x, x³+…), and the caller falls back to numeric roots.
 */

import { type Node } from '@classytic/stage';
import { toStr, type Complex } from '../math/complex/core.js';
import { fromAst, trim } from '../math/poly/core.js';

const cleanNum = (n: number): number => { const r = Math.round(n * 1e9) / 1e9; return Object.is(r, -0) ? 0 : r; };

/** Coefficients [a0, a1, …] of `node` as a polynomial in `x` (the canonical poly
 *  engine does the extraction). null if it isn't polynomial in x. */
export const polyCoeffs = fromAst;

export interface PolySolution {
  coeffs: number[];
  degree: number;
  roots: Complex[];      // every root (real ones have im 0)
  realRoots: number[];   // the real roots, sorted
  discriminant?: number; // quadratic
}

/** Solve `node` = 0 for x exactly (degree 1 or 2). null if not a usable polynomial. */
export function solvePoly(node: Node, x = 'x', params: Record<string, number> = {}): PolySolution | null {
  const raw = polyCoeffs(node, x, params);
  if (!raw) return null;
  const coeffs = trim(raw);
  const degree = coeffs.length - 1;
  if (degree === 1) {
    const a0 = coeffs[0]!, a1 = coeffs[1]!;
    const r = cleanNum(-a0 / a1);
    return { coeffs, degree, roots: [{ re: r, im: 0 }], realRoots: [r] };
  }
  if (degree === 2) {
    const c0 = coeffs[0]!, c1 = coeffs[1]!, c2 = coeffs[2]!;
    const disc = c1 * c1 - 4 * c2 * c0;
    const twoA = 2 * c2;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const real = [cleanNum((-c1 - s) / twoA), cleanNum((-c1 + s) / twoA)].sort((u, v) => u - v);
      return { coeffs, degree, discriminant: disc, roots: real.map((r) => ({ re: r, im: 0 })), realRoots: real };
    }
    const s = Math.sqrt(-disc), re = cleanNum(-c1 / twoA), im = cleanNum(s / twoA);
    return { coeffs, degree, discriminant: disc, roots: [{ re, im: -im }, { re, im }], realRoots: [] };
  }
  return null; // degree 0 (no equation) or ≥3 (use numeric roots)
}

/** "x = 2 or x = −2" (complex when needed), or "no real solutions" framing. */
export function solutionTex(sol: PolySolution, x = 'x'): string {
  if (sol.roots.length === 1) return `${x} = ${toStr(sol.roots[0]!)}`;
  const [r1, r2] = sol.roots;
  if (r1 && r2 && r1.re === r2.re && r1.im === r2.im) return `${x} = ${toStr(r1)} \\text{ (repeated)}`;
  return `${x} = ${toStr(r1!)} \\text{ or } ${x} = ${toStr(r2!)}`;
}
