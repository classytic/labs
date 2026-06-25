/**
 * Statistics kernels — descriptive stats + sequences/series. The labs render
 * these numbers, so pin the subtle ones (even-n median, no-mode, population vs
 * sample variance, geometric closed form vs brute sum, convergence).
 */
import { describe, it, expect } from 'vitest';
import { mean, median, mode, range, variance, stddev, quantile, fiveNumber } from '../src/statistics/core/descriptive.js';
import { nthTerm, terms, partialSum, partialSums, infiniteSum } from '../src/statistics/core/sequences.js';
import { normalCdf, normalBetween, zScore, withinSigma } from '../src/statistics/core/normal.js';

describe('descriptive statistics', () => {
  it('mean / median (odd & even n)', () => {
    expect(mean([2, 3, 3, 5, 8])).toBeCloseTo(4.2);
    expect(median([2, 3, 3, 5, 8])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('mode — multimodal, and none when nothing repeats', () => {
    expect(mode([1, 2, 2, 3, 3])).toEqual([2, 3]);
    expect(mode([1, 2, 3])).toEqual([]);
  });
  it('range / variance / σ (population vs sample)', () => {
    expect(range([2, 8])).toBe(6);
    expect(variance([2, 4, 6])).toBeCloseTo(2.6667, 3);       // population /n
    expect(variance([2, 4, 6], true)).toBeCloseTo(4);          // sample /(n-1)
    expect(stddev([2, 4, 6], true)).toBeCloseTo(2);
  });
  it('outlier moves mean far more than median', () => {
    const base = [4, 5, 6];
    const out = [4, 5, 6, 100];
    expect(Math.abs(mean(out) - mean(base))).toBeGreaterThan(20);
    expect(Math.abs(median(out) - median(base))).toBeLessThan(1);
  });
  it('quantiles / five-number summary', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    const f = fiveNumber([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(f.median).toBe(4.5);
    expect(f.iqr).toBeCloseTo(f.q3 - f.q1);
  });
});

describe('sequences & series', () => {
  it('arithmetic nth term + closed-form sum equals brute sum', () => {
    const s = { kind: 'arithmetic' as const, first: 3, step: 2 };
    expect(nthTerm(s, 4)).toBe(9);                              // 3,5,7,9
    expect(partialSum(s, 4)).toBe(24);
    expect(partialSum(s, 4)).toBe(terms(s, 4).reduce((a, b) => a + b, 0));
  });
  it('geometric nth term + closed form', () => {
    const s = { kind: 'geometric' as const, first: 2, step: 3 };
    expect(nthTerm(s, 3)).toBe(18);                             // 2,6,18
    expect(partialSum(s, 3)).toBe(26);
    expect(partialSums(s, 3)).toEqual([2, 8, 26]);
  });
  it('geometric convergence: ½+¼+⅛+… → 1', () => {
    const s = { kind: 'geometric' as const, first: 0.5, step: 0.5 };
    expect(infiniteSum(s)).toBeCloseTo(1);
    expect(partialSum(s, 20)).toBeCloseTo(1, 4);
  });
  it('geometric diverges when |r| ≥ 1', () => {
    expect(infiniteSum({ kind: 'geometric', first: 1, step: 2 })).toBeNull();
    expect(infiniteSum({ kind: 'arithmetic', first: 1, step: 1 })).toBeNull();
  });
});

describe('normal distribution', () => {
  it('standard-normal cdf landmarks', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 5);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
  it('the 68–95–99.7 rule', () => {
    expect(withinSigma(1)).toBeCloseTo(0.6827, 3);
    expect(withinSigma(2)).toBeCloseTo(0.9545, 3);
    expect(withinSigma(3)).toBeCloseTo(0.9973, 3);
  });
  it('area between bounds + z-score scale-invariance', () => {
    // P(μ-σ ≤ X ≤ μ+σ) is the same for any μ, σ
    expect(normalBetween(8, 12, 10, 2)).toBeCloseTo(withinSigma(1), 4);
    expect(zScore(12, 10, 2)).toBe(1);
    expect(zScore(7, 10, 2)).toBe(-1.5);
  });
});
