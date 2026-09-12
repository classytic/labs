import { describe, expect, it } from 'vitest';
import {
  GROWTH_CLASSES,
  PRACTICAL_CLASSES,
  formatOperations,
  growthAt,
  intractableAt,
  operations,
  timesSlower,
  type GrowthClass,
} from '../src/algorithms/growth.js';

describe('operation counts', () => {
  it('matches the arithmetic each class names', () => {
    expect(operations('constant', 1000)).toBe(1);
    expect(operations('linear', 1000)).toBe(1000);
    expect(operations('quadratic', 1000)).toBe(1_000_000);
    expect(operations('log', 1024)).toBe(10);
    expect(operations('linearithmic', 1024)).toBe(10240);
  });

  it('treats n below one as one, so nothing divides by zero downstream', () => {
    for (const kind of GROWTH_CLASSES) expect(operations(kind, 0)).toBeGreaterThanOrEqual(1);
  });

  it('never decreases as the input grows', () => {
    for (const kind of GROWTH_CLASSES) {
      let previous = 0;
      for (const n of [1, 2, 4, 8, 16, 64, 256]) {
        const value = operations(kind, n);
        expect(value).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    }
  });

  it('adds one step to a logarithmic search each time the input doubles', () => {
    expect(operations('log', 512)).toBe(operations('log', 256) + 1);
    expect(operations('log', 1024)).toBe(operations('log', 512) + 1);
  });

  it('quadruples quadratic work when the input doubles', () => {
    expect(operations('quadratic', 200)).toBe(operations('quadratic', 100) * 4);
  });
});

describe('the comparison that makes the point', () => {
  it('keeps the classes close together at a small input', () => {
    // At n = 8 a student has no reason to care, which is exactly why small examples mislead.
    expect(timesSlower('quadratic', 'linearithmic', 8)).toBeLessThan(4);
  });

  it('separates them brutally at a realistic input', () => {
    expect(timesSlower('quadratic', 'linearithmic', 1000)).toBeGreaterThan(90);
    expect(timesSlower('quadratic', 'log', 1000)).toBeGreaterThan(90_000);
  });

  it('orders every class cheapest first at any size', () => {
    for (const n of [1, 10, 100, 1000]) {
      const counts = growthAt(n).map((row) => row.operations);
      expect(counts).toEqual([...counts].sort((a, b) => a - b));
    }
  });

  it('returns one row per PRACTICAL class with a share between 0 and 1', () => {
    const rows = growthAt(64);
    expect(rows).toHaveLength(PRACTICAL_CLASSES.length);
    for (const row of rows) {
      expect(row.share).toBeGreaterThanOrEqual(0);
      expect(row.share).toBeLessThanOrEqual(1);
    }
  });

  it('leaves O(2ⁿ) out of the chart, because it shares no scale with the rest', () => {
    // Found by rendering, not by reasoning. Scaling against 10^301 collapsed every practical
    // class to an invisible sliver, so the chart taught nothing about n log n against n².
    expect(growthAt(1000).map((row) => row.kind)).not.toContain('exponential');
    expect(GROWTH_CLASSES).toContain('exponential');
    expect(intractableAt(1000).operations).toBeGreaterThan(1e300);
  });

  it('keeps every practical class readable at a large input, which is the whole point of the scale', () => {
    const rows = growthAt(1000);
    const linear = rows.find((row) => row.kind === 'linear')!;
    const linearithmic = rows.find((row) => row.kind === 'linearithmic')!;
    // Half the width for O(n) against O(n²), and clearly separated from O(n log n).
    expect(linear.share).toBeGreaterThan(0.3);
    expect(linearithmic.share).toBeGreaterThan(linear.share);
    expect(linearithmic.share).toBeLessThan(1);
  });
});

describe('formatting a number that stops being readable', () => {
  it('groups ordinary numbers', () => {
    expect(formatOperations(1000)).toBe('1,000');
    expect(formatOperations(999_999)).toBe('999,999');
  });

  it('switches to a power of ten once the digits stop meaning anything', () => {
    expect(formatOperations(1_000_000)).toContain('× 10^');
  });

  it('says plainly when a value overflows rather than printing Infinity', () => {
    const huge = operations('exponential' as GrowthClass, 5000);
    expect(Number.isFinite(huge)).toBe(false);
    expect(formatOperations(huge)).toBe('more than a computer can represent');
  });
});
