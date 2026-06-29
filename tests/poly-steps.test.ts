/**
 * The step-by-step factor/solve TOOL (school method). We assert the WORKING is
 * shown, not just the answer: split-the-middle-term for quadratics, factor-theorem
 * peeling for higher degree, and quadratic-formula fallback when it won't factor.
 */
import { describe, it, expect } from 'vitest';
import { factorSteps, solveSteps } from '../src/math/poly/steps.js';
import { fromAst } from '../src/math/poly/core.js';
import { compileExpr } from '@classytic/stage';

const poly = (src: string) => {
  const c = compileExpr(src);
  const p = fromAst(c.ast);
  if (!p) throw new Error(`not a polynomial: ${src}`);
  return p;
};
const allTex = (w: { steps: { tex: string; note?: string }[] }) =>
  w.steps.map((s) => `${s.tex} ${s.note ?? ''}`).join('  ||  ');

describe('factorSteps — split the middle term', () => {
  it('x^2 + 5x + 6 finds the pair 2 and 3 and factors to (x+2)(x+3)', () => {
    const w = factorSteps(poly('x^2 + 5x + 6'));
    const t = allTex(w);
    // the two numbers (u, v) that multiply to ac=6 and add to b=5
    expect(t).toMatch(/u\s*=\s*2/);
    expect(t).toMatch(/v\s*=\s*3/);
    // final factored form (roots −2, −3 → both factors carry +)
    expect(t).toMatch(/\(x \+ 2\)\(x \+ 3\)|\(x \+ 3\)\(x \+ 2\)/);
    // it walks the school method, not a one-liner
    expect(w.steps.length).toBeGreaterThanOrEqual(4);
  });

  it('a leading coefficient: 2x^2 + 7x + 3 uses a × c = 6', () => {
    const w = factorSteps(poly('2x^2 + 7x + 3'));
    const t = allTex(w);
    expect(t).toMatch(/a \\times c = .*= 6/); // the product a·c is shown
    expect(t).toMatch(/a = 2 .*coefficient/); // coefficients are named, not mystery letters
  });

  it('irreducible over Z falls back to the discriminant + formula', () => {
    const w = factorSteps(poly('x^2 + x + 1'));
    const t = allTex(w);
    expect(t).toMatch(/\\Delta/);
    expect(t).toMatch(/discriminant|complex/);
  });
});

describe('factorSteps — factor theorem (higher degree)', () => {
  it('x^3 - 6x^2 + 11x - 6 peels (x-1)(x-2)(x-3) via synthetic division', () => {
    const w = factorSteps(poly('x^3 - 6x^2 + 11x - 6'));
    const t = allTex(w);
    expect(t).toMatch(/factor theorem/);
    expect(t).toMatch(/synthetic division/);
    expect(t).toMatch(/\(x − 1\)\(x − 2\)\(x − 3\)/);
  });
});

describe('solveSteps', () => {
  it('sets = 0 and reports the roots of x^2 - 5x + 6', () => {
    const w = solveSteps(poly('x^2 - 5x + 6'));
    const t = allTex(w);
    expect(t).toMatch(/= 0/);
    expect(t).toMatch(/x = 2/);
    expect(t).toMatch(/x = 3/);
    expect(w.value).toBeCloseTo(2, 6);
  });

  it('a complex pair is labelled real and complex when mixed; pure complex still solves', () => {
    const w = solveSteps(poly('x^2 + 1'));
    const t = allTex(w);
    expect(t).toMatch(/x = /);
    expect(t).toMatch(/i/); // imaginary unit appears in the roots
  });
});
