/**
 * Polynomial core tests — any-degree roots (Durand–Kerner), exact snapping, and
 * factored form.
 */

import { describe, it, expect } from 'vitest';
import { compileExpr, type Node } from '@classytic/stage';
import { solve, solveEquation, factorTex, fromAst, evalPoly, deriv, type Poly } from '../src/math/poly/core.js';

const ast = (src: string): Node => { const c = compileExpr(src); if (c.error) throw new Error(c.error); return c.ast; };
const reals = (p: Poly): number[] => solve(p)!.realRoots;

describe('polynomial roots (Durand–Kerner) + exact snapping', () => {
  it('cubic with three integer roots', () => {
    // (x-1)(x-2)(x-3) = x³ − 6x² + 11x − 6
    expect(reals([-6, 11, -6, 1])).toEqual([1, 2, 3]);
  });
  it('rational roots snap exactly', () => {
    // 2x² − 3x + 1 = (2x − 1)(x − 1) → roots ½, 1
    expect(reals([1, -3, 2])).toEqual([0.5, 1]);
  });
  it('complex roots: x³ − 1 → 1, ω, ω²', () => {
    const s = solve([-1, 0, 0, 1])!;
    expect(s.realRoots).toEqual([1]);
    expect(s.roots).toHaveLength(3);
    // the two complex cube-roots of unity: −½ ± (√3/2)i
    const cmplx = s.roots.filter((r) => r.im !== 0);
    expect(cmplx.every((r) => Math.abs(r.re + 0.5) < 1e-6 && Math.abs(Math.abs(r.im) - Math.sqrt(3) / 2) < 1e-6)).toBe(true);
  });
  it('quartic x⁴ − 1 → ±1, ±i', () => {
    const s = solve([-1, 0, 0, 0, 1])!;
    expect(s.realRoots).toEqual([-1, 1]);
    expect(s.roots.filter((r) => r.im !== 0)).toHaveLength(2);
  });
  it('no real roots: x² + 1', () => {
    expect(solve([1, 0, 1])!.realRoots).toEqual([]);
  });
});

describe('factored form', () => {
  it('factors a cubic over the integers', () => {
    expect(factorTex([-6, 11, -6, 1])).toBe('(x − 1)(x − 2)(x − 3)');
  });
  it('leaves an irreducible quadratic for complex pairs', () => {
    expect(factorTex([1, 0, 1])).toBe('(x^2 + 1)');             // x²+1
    expect(factorTex([2, -2, 1])).toBe('(x^2 − 2x + 2)');        // roots 1±i
  });
});

describe('AST → poly + calculus', () => {
  it('solveEquation works on a typed expression, any degree', () => {
    expect(solveEquation(ast('x^3 - 6*x^2 + 11*x - 6'))!.realRoots).toEqual([1, 2, 3]);
    expect(solveEquation(ast('sin(x)'))).toBeNull();           // not polynomial
  });
  it('fromAst + eval + derivative', () => {
    const p = fromAst(ast('x^2 + 3*x + 2'))!;
    expect(p).toEqual([2, 3, 1]);
    expect(evalPoly(p, 2)).toBe(12);     // 4 + 6 + 2
    expect(deriv(p)).toEqual([3, 2]);    // 2x + 3
  });
});
