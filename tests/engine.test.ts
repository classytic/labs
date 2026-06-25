/**
 * Interactive-problem engine cores — the pure spine (no React): expr-analysis
 * (roots / intersections / tangent / normal / area) and answer-check (numeric +
 * symbolic equivalence). These are what let a creator author a problem as config
 * and have the engine both DERIVE the answer and CHECK the student's.
 */

import { describe, it, expect } from 'vitest';
import { compileExpr, parseExpr as parse } from '@classytic/stage';
import { roots, intersections, tangentAt, normalAt, integrate, areaBetween, checkNumber, checkExpression, checkAnswer, parseValue } from '../dist/math/index.mjs';

const fn = (src: string, params: Record<string, number> = {}) => {
  const c = compileExpr(src);
  if (!('fn' in c)) throw new Error('bad expr: ' + src);
  return (x: number) => c.fn({ ...params, x });
};

describe('expr-analysis · roots & intersections', () => {
  it('finds the roots of x^2 - 4 on [-5,5]', () => {
    const r = roots(fn('x^2 - 4'), -5, 5).sort((a, b) => a - b);
    expect(r.length).toBe(2);
    expect(r[0]!).toBeCloseTo(-2, 5);
    expect(r[1]!).toBeCloseTo(2, 5);
  });

  it('counts intersections of |x-4| and k/x, transitioning 3 → 1 at the critical k=4 (Q12)', () => {
    const modf = fn('abs(x - 4)');
    const count = (k: number) => intersections(modf, fn('k/x', { k }), 0.05, 40).length;
    expect(count(1)).toBe(3);   // k < 4: two on the left arm + one on the right
    expect(count(8)).toBe(1);   // k > 4: left arm misses, only the right intersection
  });
});

describe('expr-analysis · tangent / normal / area', () => {
  it('tangent to x^2 at x=3 is y = 6x - 9', () => {
    const t = tangentAt(parse('x^2'), 3)!;
    expect(t.m).toBeCloseTo(6, 6);
    expect(t.c).toBeCloseTo(-9, 6);
  });

  it('normal to x^2 at x=3 has gradient -1/6 through (3,9)', () => {
    const n = normalAt(parse('x^2'), 3)!;
    expect(n.m).toBeCloseTo(-1 / 6, 6);
    expect(n.f(3)).toBeCloseTo(9, 6);
  });

  it('∫_0^1 x^2 = 1/3 and area between x^2 and x on [0,1] = 1/6', () => {
    expect(integrate(fn('x^2'), 0, 1)).toBeCloseTo(1 / 3, 6);
    expect(areaBetween(fn('x'), fn('x^2'), 0, 1)).toBeCloseTo(1 / 6, 6);
  });
});

describe('answer-check · numeric', () => {
  it('accepts equivalent numeric forms and rejects wrong ones', () => {
    expect(checkNumber(parseValue('pi/2'), Math.PI / 2)).toBe(true);
    expect(checkNumber(parseValue('2*sqrt(5)'), Math.sqrt(20))).toBe(true);
    expect(checkAnswer({ kind: 'number', value: 21.0, tol: 1e-2 }, '21.03')).toBe(true);
    expect(checkAnswer({ kind: 'number', value: 21.0 }, '25')).toBe(false);
  });
});

describe('answer-check · symbolic + numeric equivalence', () => {
  it('accepts any algebraically-equivalent expression', () => {
    expect(checkExpression('(x+1)*(x+2)', 'x^2 + 3*x + 2')).toBe(true);
    expect(checkExpression('2*sin(x)*cos(x)', 'sin(2*x)')).toBe(true);
    expect(checkAnswer({ kind: 'expression', value: '6*x - 9' }, '3*(2*x - 3)')).toBe(true);
  });
  it('rejects non-equivalent expressions', () => {
    expect(checkExpression('x^2 + 3*x + 1', 'x^2 + 3*x + 2')).toBe(false);
    expect(checkExpression('cos(x)', 'sin(x)')).toBe(false);
  });
});
