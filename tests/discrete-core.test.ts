/**
 * Discrete-math core kernels — the counting/probability/set source-of-truth the
 * labs (and teaching agents) read. Pure functions, imported from src.
 */

import { describe, it, expect } from 'vitest';
import {
  factorial, nPr, nCr, multinomial, starsAndBars, gcd, lcm,
  union, intersection, difference, symmetricDifference, powerset, cartesian, isSubset, setEqual,
  inclusionExclusion,
  probability, conditional, bayes, independent, expectedValue, atLeastOne,
  guaranteedOccupancy, minToGuaranteePair, minForOccupancy,
  mulberry32, shuffle, randInt,
} from '../src/discrete/core/index.js';

describe('combinatorics', () => {
  it('factorial / nPr / nCr and the headline identity nCr = nPr/k!', () => {
    expect(factorial(5)).toBe(120);
    expect(nPr(5, 3)).toBe(60);
    expect(nCr(5, 3)).toBe(10);
    expect(nCr(5, 3)).toBe(nPr(5, 3) / factorial(3)); // the whole Counting lesson
    expect(nCr(52, 5)).toBe(2598960);                  // poker hands
    expect(nCr(5, 0)).toBe(1);
    expect(nCr(5, 6)).toBe(0);
    expect(nCr(10, 7)).toBe(nCr(10, 3));               // symmetry
  });
  it('multinomial / stars-and-bars / gcd / lcm', () => {
    expect(multinomial(1, 1, 1)).toBe(6);              // MISSISSIPPI-style on distinct
    expect(multinomial(2, 1)).toBe(3);
    expect(starsAndBars(5, 3)).toBe(nCr(7, 2));        // 5 items, 3 bins
    expect(gcd(12, 18)).toBe(6);
    expect(lcm(4, 6)).toBe(12);
  });
});

describe('sets (the logic↔sets spine)', () => {
  const A = [1, 2, 3], B = [3, 4];
  it('ops dedupe + order-stable', () => {
    expect(union(A, B)).toEqual([1, 2, 3, 4]);
    expect(intersection(A, B)).toEqual([3]);
    expect(difference(A, B)).toEqual([1, 2]);
    expect(symmetricDifference(A, B)).toEqual([1, 2, 4]);
    expect(union([1, 1, 2], [2, 3])).toEqual([1, 2, 3]);
  });
  it('subset / equal / powerset / cartesian', () => {
    expect(isSubset([1, 2], A)).toBe(true);
    expect(setEqual([3, 2, 1], A)).toBe(true);
    expect(powerset([1, 2])).toHaveLength(4);
    expect(cartesian([1, 2], ['a'])).toEqual([[1, 'a'], [2, 'a']]);
  });
});

describe('inclusion–exclusion (overcount, then correct)', () => {
  it('|A∪B| with the signed terms', () => {
    const r = inclusionExclusion([[1, 2, 3], [3, 4]]);
    expect(r.unionSize).toBe(4);
    expect(r.terms.map((t) => [t.indices.length, t.size, t.sign]))
      .toEqual([[1, 3, 1], [1, 2, 1], [2, 1, -1]]); // +|A| +|B| −|A∩B|
  });
  it('3-set union', () => {
    expect(inclusionExclusion([[1, 2, 3, 4], [3, 4, 5], [4, 6]]).unionSize).toBe(6);
  });
});

describe('probability (conditioning + base rates)', () => {
  it('basics + complement', () => {
    expect(probability(1, 6)).toBeCloseTo(1 / 6);
    expect(conditional(0.1, 0.4)).toBeCloseTo(0.25);
  });
  it('Bayes base-rate shock: 99% test, 1-in-10000 prevalence → P(sick|+) < 1%', () => {
    const p = bayes(0.99, 1 / 10000, 0.01);
    expect(p).toBeLessThan(0.01);
  });
  it('independence ≠ disjoint', () => {
    expect(independent(0.5, 0.5, 0.25)).toBe(true);
    expect(independent(0.5, 0.5, 0)).toBe(false);     // disjoint ⇒ dependent
  });
  it('expected value + at-least-one', () => {
    expect(expectedValue([{ p: 0.5, value: 1 }, { p: 0.5, value: 3 }])).toBe(2);
    expect(atLeastOne(1 / 6, 2)).toBeCloseTo(1 - (5 / 6) ** 2);
  });
});

describe('pigeonhole (guarantee, not luck)', () => {
  it('socks + occupancy', () => {
    expect(minToGuaranteePair(2)).toBe(3);            // 2 colours → 3 socks
    expect(guaranteedOccupancy(13, 12)).toBe(2);       // 13 people, 12 months
    expect(minForOccupancy(12, 3)).toBe(25);           // force 3 in some month
  });
});

describe('rng (deterministic / replayable)', () => {
  it('same seed → same sequence; different seed differs', () => {
    const a = mulberry32(42), b = mulberry32(42), c = mulberry32(7);
    const seq = (r: () => number): number[] => [r(), r(), r()];
    expect(seq(a)).toEqual(seq(b));
    expect(seq(mulberry32(42))).not.toEqual(seq(c));
  });
  it('shuffle is a permutation; randInt in range', () => {
    const r = mulberry32(1);
    expect(shuffle([1, 2, 3, 4], r).sort()).toEqual([1, 2, 3, 4]);
    const n = randInt(mulberry32(2), 1, 6);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(6);
  });
});
