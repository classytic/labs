import { describe, expect, it } from 'vitest';
import {
  accumulationAt,
  derivativeAt,
  functionViewport,
  normalizeRange,
  riemannEstimate,
  riemannSlices,
  secantSlope,
  valueInRange,
} from '../../../src/math/calculus/core.js';

describe('calculus engine', () => {
  it('computes a stable numerical derivative across different x scales', () => {
    expect(derivativeAt((x) => x ** 3, 2)).toBeCloseTo(12, 7);
    expect(derivativeAt(Math.sin, 0)).toBeCloseTo(1, 8);
  });

  it('models secant convergence toward the derivative', () => {
    const fn = (x: number): number => x * x;
    expect(secantSlope(fn, 2, 1)).toBe(5);
    expect(secantSlope(fn, 2, 1e-4)).toBeCloseTo(4, 3);
  });

  it('preserves orientation when integration bounds are reversed', () => {
    const forward = riemannEstimate((x) => x, 0, 2, 10_000, 'mid');
    const reverse = riemannEstimate((x) => x, 2, 0, 10_000, 'mid');
    expect(forward).toBeCloseTo(2, 8);
    expect(reverse).toBeCloseTo(-2, 8);
  });

  it('builds finite, left-to-right rectangle geometry for reversed bounds', () => {
    const slices = riemannSlices((x) => x, 2, -2, 4, 'right');
    expect(slices).toHaveLength(4);
    expect(slices[0]).toMatchObject({ x0: -2, x1: -1, sampleX: -1, height: -1 });
    expect(slices[3]).toMatchObject({ x0: 1, x1: 2, sampleX: 2, height: 2 });
  });

  it('produces finite viewport bounds and trims isolated extreme samples', () => {
    const viewport = functionViewport((x) => (x === 0 ? 1e12 : x), [-1, 1]);
    expect(viewport.yMin).toBeLessThan(0);
    expect(viewport.yMax).toBeLessThan(10);
    expect(viewport.yMax).toBeGreaterThan(0);
  });

  it('satisfies the Fundamental Theorem numerically', () => {
    const fn = (x: number): number => Math.sin(x) + 0.25 * x * x;
    const accumulation = (x: number): number => accumulationAt(fn, -1.25, x);
    for (const x of [-0.5, 0, 1.2, 2.5]) expect(derivativeAt(accumulation, x)).toBeCloseTo(fn(x), 7);
    expect(accumulationAt(fn, 2, -1)).toBeCloseTo(-accumulationAt(fn, -1, 2), 10);
  });

  it('normalizes untrusted author ranges and probe values', () => {
    expect(normalizeRange([4, -2])).toEqual([-2, 4]);
    expect(normalizeRange([3, 3])).toEqual([2, 4]);
    expect(normalizeRange([Number.NaN, Number.POSITIVE_INFINITY], [-1, 5])).toEqual([-1, 5]);
    expect(valueInRange(Number.NaN, [-2, 2], 1)).toBe(1);
    expect(valueInRange(9, [-2, 2], 0)).toBe(2);
  });
});
