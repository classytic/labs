/**
 * Complex-number kernel tests, the numbers + the safety guards every Argand /
 * polar / roots-of-unity lab trusts.
 */

import { describe, it, expect } from 'vitest';
import {
  cx, I, ONE, add, sub, mul, div, neg, conj, abs, arg, argDeg, fromPolar, toPolar,
  iPow, powInt, rootsOfUnity, nthRoots, omega, eq, isFiniteC, toStr, TWO_PI, MAX_ROOTS,
} from '../src/math/complex/core.js';

describe('complex arithmetic', () => {
  it('i² = −1, and the basic ops', () => {
    expect(eq(mul(I, I), cx(-1))).toBe(true);            // the whole point of i
    expect(add(cx(3, 2), cx(1, -5))).toEqual({ re: 4, im: -3 });
    expect(sub(cx(3, 2), cx(1, -5))).toEqual({ re: 2, im: 7 });
    expect(mul(cx(3), cx(0, 2))).toEqual({ re: 0, im: 6 }); // 3 · 2i = 6i
    expect(eq(mul(cx(0, 3), cx(0, 2)), cx(-6))).toBe(true); // 3i · 2i = −6
    expect(neg(cx(2, -3))).toEqual({ re: -2, im: 3 });
    expect(conj(cx(2, -3))).toEqual({ re: 2, im: 3 });
  });
  it('division is exact for clean cases and stable for huge denominators', () => {
    expect(eq(div(cx(1), I), cx(0, -1))).toBe(true);     // 1/i = −i
    expect(eq(div(cx(-6), cx(0, 2)), cx(0, 3))).toBe(true); // −6 / 2i = 3i
    // Smith's algorithm: no overflow even with a 1e200 component
    const z = div(cx(1e200, 0), cx(1e200, 1e200));
    expect(isFiniteC(z)).toBe(true);
    expect(eq(z, cx(0.5, -0.5), 1e-6)).toBe(true);
    // zero denominator → non-finite, not a throw
    expect(isFiniteC(div(cx(1), cx(0, 0)))).toBe(false);
  });
});

describe('modulus + argument (the polar bridge)', () => {
  it('|z| via hypot, arg in rad + deg', () => {
    expect(abs(cx(3, 4))).toBe(5);                       // 3-4-5
    expect(abs(cx(1, 1))).toBeCloseTo(Math.SQRT2, 12);
    expect(argDeg(cx(0, 1))).toBeCloseTo(90, 12);        // i points up
    expect(argDeg(cx(-1, 0))).toBeCloseTo(180, 12);
    expect(arg(cx(0, 0))).toBe(0);                       // arg(0) convention
    expect(abs(cx(1e200, 1e200))).toBeLessThan(Infinity); // hypot doesn't overflow
  });
  it('fromPolar / toPolar round-trip', () => {
    const z = fromPolar(2, Math.PI / 3);
    const p = toPolar(z);
    expect(p.r).toBeCloseTo(2, 12);
    expect(p.theta).toBeCloseTo(Math.PI / 3, 12);
  });
});

describe('i powers (exact 4-cycle) + integer powers', () => {
  it('iⁿ cycles 1, i, −1, −i with no float drift', () => {
    expect(iPow(0)).toEqual({ re: 1, im: 0 });
    expect(iPow(1)).toEqual({ re: 0, im: 1 });
    expect(iPow(2)).toEqual({ re: -1, im: 0 });
    expect(iPow(3)).toEqual({ re: 0, im: -1 });
    expect(iPow(4)).toEqual({ re: 1, im: 0 });
    expect(iPow(-1)).toEqual({ re: 0, im: -1 });          // i^-1 = −i
    expect(iPow(102)).toEqual({ re: -1, im: 0 });          // 102 mod 4 = 2
  });
  it('powInt via squaring, with overflow + cap guards', () => {
    expect(eq(powInt(cx(1, 1), 2), cx(0, 2))).toBe(true); // (1+i)² = 2i
    expect(eq(powInt(I, 3), cx(0, -1))).toBe(true);
    expect(eq(powInt(cx(2), -1), cx(0.5))).toBe(true);     // 2^-1 = 0.5
    expect(eq(powInt(ONE, 1000), ONE)).toBe(true);
    expect(isFiniteC(powInt(cx(10), 5000))).toBe(false);   // |n| > MAX_POW → ∞, no hang
    expect(isFiniteC(powInt(cx(1e9), 100))).toBe(false);   // magnitude overflow → ∞
  });
});

describe('roots of unity + nth roots (the ω family)', () => {
  it('nth roots of unity', () => {
    const r4 = rootsOfUnity(4);
    expect(r4).toHaveLength(4);
    expect(eq(r4[0]!, cx(1))).toBe(true);
    expect(eq(r4[1]!, I)).toBe(true);                     // i
    expect(eq(r4[2]!, cx(-1))).toBe(true);                // exact −1 (snapped)
    expect(eq(r4[3]!, cx(0, -1))).toBe(true);
  });
  it('cube roots of unity: ω³ = 1 and 1 + ω + ω² = 0', () => {
    const w = omega(3);
    expect(eq(w, cx(-0.5, Math.sqrt(3) / 2), 1e-12)).toBe(true);
    expect(eq(powInt(w, 3), ONE, 1e-9)).toBe(true);        // ω³ = 1
    expect(eq(add(add(ONE, w), powInt(w, 2)), cx(0), 1e-9)).toBe(true); // 1+ω+ω²=0
  });
  it('nth roots of a value: √(−1) = ±i', () => {
    const roots = nthRoots(cx(-1), 2);
    expect(roots).toHaveLength(2);
    expect(roots.some((r) => eq(r, I, 1e-9))).toBe(true);
    expect(roots.some((r) => eq(r, cx(0, -1), 1e-9))).toBe(true);
  });
  it('root count is clamped (no billion-element arrays)', () => {
    expect(rootsOfUnity(1e9)).toHaveLength(MAX_ROOTS);
    expect(rootsOfUnity(0)).toHaveLength(1);
  });
});

describe('formatting', () => {
  it('clean a + bi strings', () => {
    expect(toStr(cx(3, -2))).toBe('3 − 2i');
    expect(toStr(I)).toBe('i');
    expect(toStr(cx(0, -1))).toBe('−i');
    expect(toStr(cx(-1, 0))).toBe('−1');
    expect(toStr(cx(0, 0))).toBe('0');
    expect(toStr(cx(0, 2))).toBe('2i');
    expect(toStr(cx(2, 1))).toBe('2 + i');
  });
});
