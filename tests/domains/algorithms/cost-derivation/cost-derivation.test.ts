import { describe, expect, it } from 'vitest';
import {
  halvingChain,
  halvingSteps,
  readout,
  recursionLevels,
  recursionTotal,
  triangleRows,
  triangleTotal,
  trianglePairs,
} from '../../../../src/algorithms/cost-derivation/core.js';

describe('cost-derivation', () => {
  it('closes the triangle: the formula equals the rows it stands for', () => {
    // The whole point of the lab. If these ever disagree, it is teaching a shortcut
    // the picture does not support.
    for (const n of [2, 3, 8, 25, 100, 1000]) {
      const summed = triangleRows(n).reduce((a, b) => a + b, 0);
      expect(triangleTotal(n)).toBe(summed);
    }
  });

  it('pairs the ends, and every pair sums to n', () => {
    for (const n of [9, 10, 101]) {
      for (const p of trianglePairs(n)) expect(p.sum).toBe(n);
    }
  });

  it('has nothing to compare below two items', () => {
    expect(triangleRows(1)).toEqual([]);
    expect(triangleTotal(1)).toBe(0);
    expect(triangleTotal(0)).toBe(0);
  });

  it('counts halvings, and the count IS the logarithm', () => {
    // The numbers the course used to assert without showing.
    expect(halvingSteps(8)).toBe(3);
    expect(halvingSteps(1000)).toBe(10);
    expect(halvingSteps(1024)).toBe(10);
    for (const k of [1, 2, 5, 10, 16]) expect(halvingSteps(2 ** k)).toBe(k);
  });

  it('halves all the way down to one, and stops', () => {
    expect(halvingChain(8)).toEqual([8, 4, 2, 1]);
    expect(halvingChain(1)).toEqual([1]);
    const chain = halvingChain(1000);
    expect(chain[0]).toBe(1000);
    expect(chain.at(-1)).toBe(1);
    // Each step is half the one before, rounded down.
    for (let i = 1; i < chain.length; i++) expect(chain[i]).toBe(Math.floor(chain[i - 1]! / 2));
  });

  it('keeps the work per LEVEL flat, which is why the answer is n log n', () => {
    // Twice as many calls, each half the size: the product does not move. This is the
    // observation the recursion tree exists to make.
    for (const level of recursionLevels(64)) expect(level.workHere).toBeCloseTo(64, 9);
    expect(recursionLevels(64)).toHaveLength(halvingSteps(64) + 1);
  });

  it('doubles the calls and halves the size at each depth', () => {
    const levels = recursionLevels(32);
    for (const l of levels) {
      expect(l.calls).toBe(2 ** l.depth);
      expect(l.sizeEach).toBeCloseTo(32 / 2 ** l.depth, 9);
    }
  });

  it('gives merge sort n log n, not n squared', () => {
    expect(recursionTotal(1024)).toBe(1024 * 10);
    // The comparison the whole chapter turns on: at 1000 items the gap is ~100x,
    // which is why "ten times" is the common wrong answer.
    const ratio = triangleTotal(1000) / recursionTotal(1000);
    expect(ratio).toBeGreaterThan(45);
    expect(ratio).toBeLessThan(60);
  });

  it('reports the formula a learner should be able to reproduce', () => {
    expect(readout('nested', 1000).steps).toBe(499500);
    expect(readout('nested', 1000).bigO).toBe('O(n²)');
    expect(readout('halving', 1000).steps).toBe(10);
    expect(readout('recursion', 1000).bigO).toBe('O(n log n)');
  });
});
