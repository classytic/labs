import { describe, expect, it } from 'vitest';
import {
  denominator,
  formOf,
  maxDisagreement,
  partialFractionProblems,
  solveParts,
  rationalText,
  termTex,
  type Factor,
} from '../src/math/partial-fractions/core.js';

const L = (a: number, b: number, power?: number): Factor => ({ kind: 'linear', a, b, power });

describe('the FORM, which is the line that gets graded', () => {
  it('gives one term per distinct linear factor', () => {
    const form = formOf([L(1, -1), L(1, 2)]);
    expect(form.map((t) => t.denomTex)).toEqual(['(x - 1)', '(x + 2)']);
    expect(form.every((t) => t.unknowns === 1)).toBe(true);
  });

  it('gives a repeated factor a term at EVERY power, not just the highest', () => {
    // The classic lost mark: writing A/(x-1) + B/(x+2)^2 and omitting the (x+2) term.
    const form = formOf([L(1, -1), L(1, 2, 2)]);
    expect(form.map((t) => t.denomTex)).toEqual(['(x - 1)', '(x + 2)', '(x + 2)^2']);
  });

  it('gives an irreducible quadratic a LINEAR numerator', () => {
    const form = formOf([L(1, -1), { kind: 'quadratic', a: 1, b: 0, c: 1 }]);
    expect(form[1]!.denomTex).toBe('(x^2 + 1)');
    expect(form[1]!.unknowns).toBe(2); // Bx + C, not just B
  });

  it('counts unknowns equal to the degree of the denominator', () => {
    // The structural reason the form is what it is: the system must be square.
    for (const factors of [
      [L(1, -1), L(1, 2)],
      [L(1, -1), L(1, 2, 2)],
      [L(1, -1), { kind: 'quadratic', a: 1, b: 0, c: 1 } as Factor],
      [L(2, 1), L(1, -3), L(1, 1)],
    ]) {
      const unknowns = formOf(factors).reduce((n, t) => n + t.unknowns, 0);
      expect(unknowns).toBe(denominator(factors).length - 1);
    }
  });
});

describe('solving the constants', () => {
  it('splits the standard two-factor case', () => {
    // (3x + 1)/((x-1)(x+2)) = A/(x-1) + B/(x+2), with A = 4/3 and B = 5/3.
    // Cover-up: A = (3+1)/(1+2) = 4/3, B = (-6+1)/(-2-1) = 5/3.
    const parts = solveParts([1, 3], [L(1, -1), L(1, 2)])!;
    expect(parts[0]!.value![0]).toBeCloseTo(4 / 3, 9);
    expect(parts[1]!.value![0]).toBeCloseTo(5 / 3, 9);
  });

  it('splits a repeated factor', () => {
    // 1/((x)(x+1)^2) = 1/x - 1/(x+1) - 1/(x+1)^2, a standard textbook result.
    const parts = solveParts([1], [L(1, 0), L(1, 1, 2)])!;
    expect(parts.map((p) => p.value![0])).toEqual([
      expect.closeTo(1, 9),
      expect.closeTo(-1, 9),
      expect.closeTo(-1, 9),
    ]);
  });

  it('splits over an irreducible quadratic', () => {
    // 1/((x-1)(x^2+1)) = (1/2)/(x-1) + (-x/2 - 1/2)/(x^2+1)
    const parts = solveParts([1], [L(1, -1), { kind: 'quadratic', a: 1, b: 0, c: 1 }])!;
    expect(parts[0]!.value![0]).toBeCloseTo(0.5, 9);
    const [c, b] = parts[1]!.value!;
    expect(b).toBeCloseTo(-0.5, 9);
    expect(c).toBeCloseTo(-0.5, 9);
  });

  it('handles a factor whose x-coefficient is not 1', () => {
    // 5/((2x+1)(x-2)) : cover-up at x = 2 gives B = 5/5 = 1; at x = -1/2 gives A = 5/(-2.5) = -2,
    // and A sits over (2x+1) so it is -2 as written.
    const parts = solveParts([5], [L(2, 1), L(1, -2)])!;
    expect(maxDisagreement([5], [L(2, 1), L(1, -2)], parts)).toBeLessThan(1e-9);
  });
});

describe('the decomposition really is the same function', () => {
  it('agrees with the original at every sample point', () => {
    for (const [num, factors] of [
      [
        [1, 3],
        [L(1, -1), L(1, 2)],
      ],
      [[1], [L(1, 0), L(1, 1, 2)]],
      [[1], [L(1, -1), { kind: 'quadratic', a: 1, b: 0, c: 1 } as Factor]],
      [
        [2, 1],
        [L(1, 3), L(1, -2)],
      ],
    ] as [number[], Factor[]][]) {
      const parts = solveParts(num, factors)!;
      expect(parts).not.toBeNull();
      expect(maxDisagreement(num, factors, parts)).toBeLessThan(1e-9);
    }
  });

  it('reports a large disagreement when the constants are wrong', () => {
    // Proves the verifier is not vacuously returning zero.
    const factors = [L(1, -1), L(1, 2)];
    const parts = solveParts([1, 3], factors)!;
    const wrong = parts.map((p) => ({ ...p, value: [p.value![0]! + 1] }));
    expect(maxDisagreement([1, 3], factors, wrong)).toBeGreaterThan(0.1);
  });
});

describe('rendering', () => {
  it('writes a constant numerator plainly', () => {
    const parts = solveParts([1], [L(1, 0), L(1, 1, 2)])!;
    expect(termTex(parts[0]!)).toBe('\\frac{1}{(x)}');
    expect(termTex(parts[2]!)).toBe('\\frac{-1}{(x + 1)^2}');
  });

  it('writes a linear numerator as Bx + C', () => {
    const parts = solveParts([1], [L(1, -1), { kind: 'quadratic', a: 1, b: 0, c: 1 }])!;
    expect(termTex(parts[1]!)).toBe('\\frac{-1/2x - 1/2}{(x^2 + 1)}');
  });

  it('writes constants as exact fractions, not decimals', () => {
    // Elimination produces 1.3333333333333333. An exam answer is 4/3, and printing the decimal
    // throws away the exactness the whole method exists to deliver.
    const parts = solveParts([1, 3], [L(1, -1), L(1, 2)])!;
    expect(termTex(parts[0]!)).toBe('\\frac{4/3}{(x - 1)}');
    expect(termTex(parts[1]!)).toBe('\\frac{5/3}{(x + 2)}');
  });

  it('leaves a genuinely irrational value as a decimal rather than inventing a fraction', () => {
    expect(rationalText(Math.SQRT2)).toBe('1.414214');
    expect(rationalText(3)).toBe('3');
    expect(rationalText(-0.75)).toBe('-3/4');
  });
});

describe('authoring checks', () => {
  it('passes a proper fraction over valid factors', () => {
    expect(partialFractionProblems([1, 3], [L(1, -1), L(1, 2)])).toEqual([]);
  });

  it('refuses an IMPROPER fraction, which has no decomposition of this shape', () => {
    // Numerator degree 2 over denominator degree 2. Must be divided out first.
    const problems = partialFractionProblems([1, 0, 1], [L(1, -1), L(1, 2)]);
    expect(problems[0]).toMatch(/improper/);
    expect(problems[0]).toMatch(/divide first/);
  });

  it('refuses a "quadratic" that actually factorises', () => {
    // x^2 - 1 is (x-1)(x+1). Left whole it makes the system under-determined.
    const problems = partialFractionProblems([1], [L(1, 0), { kind: 'quadratic', a: 1, b: 0, c: -1 }]);
    expect(problems[0]).toMatch(/factorises/);
  });

  it('refuses a constant masquerading as a linear factor', () => {
    expect(partialFractionProblems([1], [L(0, 3), L(1, 1)])[0]).toMatch(/not linear/);
  });
});
