import { describe, expect, it } from 'vitest';
import { binarySearchTrace, linearSearchComparisons, sortedCopy } from '../src/algorithms/search.js';

const SAMPLE = [1, 3, 5, 7, 9, 11, 13, 15];

describe('binary search', () => {
  it('finds every value that is present, at the right index', () => {
    for (const [index, value] of SAMPLE.entries()) {
      expect(binarySearchTrace(SAMPLE, value).foundIndex).toBe(index);
    }
  });

  it('reports -1 for a value that is absent', () => {
    for (const missing of [0, 4, 16, 100]) {
      expect(binarySearchTrace(SAMPLE, missing).foundIndex).toBe(-1);
    }
  });

  it('sorts the input first, because binary search is undefined otherwise', () => {
    const trace = binarySearchTrace([9, 1, 7, 3], 7);
    expect(trace.values).toEqual([1, 3, 7, 9]);
    expect(trace.values[trace.foundIndex]).toBe(7);
  });

  it('never exceeds one probe per halving', () => {
    for (const target of [...SAMPLE, 0, 4, 100]) {
      const trace = binarySearchTrace(SAMPLE, target);
      expect(trace.comparisons).toBeLessThanOrEqual(trace.worstCase);
    }
  });

  it('keeps the window valid and shrinking at every step', () => {
    const trace = binarySearchTrace(SAMPLE, 13);
    let previous = SAMPLE.length;
    for (const step of trace.steps) {
      expect(step.lo).toBeLessThanOrEqual(step.mid);
      expect(step.mid).toBeLessThanOrEqual(step.hi);
      const width = step.hi - step.lo + 1;
      expect(width).toBeLessThanOrEqual(previous);
      previous = width;
    }
  });

  it('discards the half that cannot contain the target', () => {
    // Every surviving window must still bracket the target's position.
    const trace = binarySearchTrace(SAMPLE, 3);
    for (const step of trace.steps) {
      if (step.decision === 'found') continue;
      const survivor =
        step.decision === 'left' ? SAMPLE.slice(step.lo, step.mid) : SAMPLE.slice(step.mid + 1, step.hi + 1);
      expect(survivor).toContain(3);
    }
  });

  it('handles an empty array without probing', () => {
    const trace = binarySearchTrace([], 5);
    expect(trace.steps).toEqual([]);
    expect(trace.foundIndex).toBe(-1);
    expect(trace.comparisons).toBe(0);
  });
});

describe('why it is worth the trouble', () => {
  it('beats a scan badly on a large array', () => {
    const large = Array.from({ length: 1024 }, (_, index) => index * 2);
    const trace = binarySearchTrace(large, 2046);
    expect(trace.comparisons).toBeLessThanOrEqual(11);
    expect(trace.linearComparisons).toBe(1024);
  });

  it('loses to a scan when the target is first, which is the honest caveat', () => {
    const trace = binarySearchTrace(SAMPLE, SAMPLE[0]!);
    expect(trace.linearComparisons).toBe(1);
    expect(trace.comparisons).toBeGreaterThan(1);
  });

  it('charges a full pass for a linear scan that finds nothing', () => {
    expect(linearSearchComparisons(SAMPLE, 100)).toBe(SAMPLE.length);
  });

  it('grows by one probe each time the array doubles', () => {
    const worst = (size: number) =>
      binarySearchTrace(
        Array.from({ length: size }, (_, i) => i),
        -1,
      ).comparisons;
    expect(worst(8)).toBe(worst(4) + 1);
    expect(worst(16)).toBe(worst(8) + 1);
    expect(worst(32)).toBe(worst(16) + 1);
  });

  it('leaves the caller’s array untouched', () => {
    const input = [9, 1, 7, 3];
    sortedCopy(input);
    binarySearchTrace(input, 7);
    expect(input).toEqual([9, 1, 7, 3]);
  });
});
