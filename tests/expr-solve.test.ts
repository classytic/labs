/**
 * Tests for the hardened analysis layer: tangent-root recovery, area-split at
 * crossings, and the exact symbolic polynomial solver.
 */

import { describe, it, expect } from 'vitest';
import { compileExpr, type Node } from '@classytic/stage';
import { roots, areaBetween } from '../src/kit/expr-analysis.js';
import { solvePoly, polyCoeffs } from '../src/kit/solve.js';

const fn = (src: string): ((x: number) => number) => {
  const c = compileExpr(src);
  if (c.error) throw new Error(c.error);
  return (x) => c.fn({ x });
};
const ast = (src: string): Node => {
  const c = compileExpr(src);
  if (c.error) throw new Error(c.error);
  return c.ast;
};
const near = (got: number[], want: number[], tol = 1e-4): boolean =>
  got.length === want.length && want.every((w, i) => Math.abs((got[i] ?? NaN) - w) <= tol);

describe('roots: sign-change + tangent/double recovery', () => {
  it('crossing roots (odd multiplicity)', () => {
    expect(near(roots(fn('x^2 - 4'), -5, 5), [-2, 2])).toBe(true);
    expect(near(roots(fn('sin(x)'), -0.05, 6.3), [0, Math.PI, 2 * Math.PI], 1e-3)).toBe(true);
  });
  it('TANGENT / double roots a sign-change scan would miss', () => {
    expect(near(roots(fn('x^2'), -3, 3), [0], 1e-3)).toBe(true);          // x² touches 0
    expect(near(roots(fn('(x - 1)^2'), -3, 4), [1], 1e-3)).toBe(true);     // double root at 1
  });
  it('no phantom roots where there are none', () => {
    expect(roots(fn('x^2 + 1'), -3, 3)).toHaveLength(0);                   // never reaches 0
  });
});

describe('areaBetween splits at crossings', () => {
  it('∫|sin| over [0,2π] = 4, not 0 (the old |∫| cancelled)', () => {
    const area = areaBetween(Math.sin, () => 0, 0, 2 * Math.PI);
    expect(area).toBeGreaterThan(3.99);
    expect(area).toBeLessThan(4.01);
    // sanity: a single net integral would be ~0
    expect(Math.abs(Math.cos(0) - Math.cos(2 * Math.PI))).toBeLessThan(1e-9);
  });
});

describe('symbolic polynomial solver', () => {
  it('coefficients from the AST', () => {
    expect(polyCoeffs(ast('x^2 + 3*x + 2'))).toEqual([2, 3, 1]);
    expect(polyCoeffs(ast('2*x - 6'))).toEqual([-6, 2]);
    expect(polyCoeffs(ast('sin(x)'))).toBeNull();
  });
  it('linear + quadratic, exact, real and complex', () => {
    expect(solvePoly(ast('2*x - 6'))!.realRoots).toEqual([3]);
    expect(solvePoly(ast('x^2 - 4'))!.realRoots).toEqual([-2, 2]);
    const dbl = solvePoly(ast('x^2 - 2*x + 1'))!;
    expect(dbl.realRoots).toEqual([1, 1]);
    expect(dbl.discriminant).toBe(0);
    const cmplx = solvePoly(ast('x^2 + 1'))!;
    expect(cmplx.realRoots).toEqual([]);
    expect(cmplx.roots.map((r) => [r.re, r.im])).toEqual([[0, -1], [0, 1]]); // ±i
    expect(solvePoly(ast('sin(x)'))).toBeNull();                              // not polynomial
  });
});
