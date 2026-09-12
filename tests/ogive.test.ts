import { describe, expect, it } from 'vitest';
import {
  cumulativePoints,
  ogiveProblems,
  quartiles,
  readAt,
  totalFrequency,
  type Bin,
} from '../src/statistics/ogive/core.js';

/** A clean worked example: 40 values, quartiles that land inside classes so interpolation matters. */
const BINS: Bin[] = [
  { from: 0, to: 10, frequency: 4 },
  { from: 10, to: 20, frequency: 10 },
  { from: 20, to: 30, frequency: 14 },
  { from: 30, to: 40, frequency: 8 },
  { from: 40, to: 50, frequency: 4 },
];

describe('the curve itself', () => {
  it('starts at zero and accumulates to the total', () => {
    const points = cumulativePoints(BINS);
    expect(points[0]).toEqual({ x: 0, cumulative: 0 });
    expect(points.at(-1)).toEqual({ x: 50, cumulative: 40 });
    expect(totalFrequency(BINS)).toBe(40);
  });

  it('plots each class at its UPPER boundary, not its midpoint', () => {
    // The whole frequency of "10 to 20" has only accumulated once you are past 20. Plotting at the
    // midpoint shifts the curve half a class to the left and biases every reading the same way.
    const points = cumulativePoints(BINS);
    expect(points[2]).toEqual({ x: 20, cumulative: 14 });
    expect(points.map((p) => p.x)).toEqual([0, 10, 20, 30, 40, 50]);
  });
});

describe('reading a value off the curve', () => {
  it('interpolates inside the class the height falls in', () => {
    // 20 of 40 is the median. It sits in "20 to 30": 14 have accumulated by 20, 28 by 30, so we
    // need 6 of that class's 14, which is 20 + (6/14)*10.
    expect(readAt(BINS, 20)).toBeCloseTo(20 + (6 / 14) * 10, 10);
  });

  it('returns the boundary exactly when the height lands on one', () => {
    expect(readAt(BINS, 14)).toBe(20);
    expect(readAt(BINS, 4)).toBe(10);
  });

  it('clamps outside the data rather than extrapolating', () => {
    expect(readAt(BINS, 0)).toBe(0);
    expect(readAt(BINS, -5)).toBe(0);
    expect(readAt(BINS, 40)).toBe(50);
    expect(readAt(BINS, 999)).toBe(50);
  });
});

describe('quartiles and the spread between them', () => {
  it('uses n/4, n/2 and 3n/4, the continuous rule for grouped data', () => {
    const q = quartiles(BINS)!;
    // n/4 = 10 sits in "10 to 20": 4 by 10, 14 by 20, so 6 of that class's 10.
    expect(q.q1).toBeCloseTo(10 + (6 / 10) * 10, 10);
    expect(q.median).toBeCloseTo(20 + (6 / 14) * 10, 10);
    // 3n/4 = 30 sits in "30 to 40": 28 by 30, 36 by 40, so 2 of that class's 8.
    expect(q.q3).toBeCloseTo(30 + (2 / 8) * 10, 10);
    expect(q.iqr).toBeCloseTo(q.q3 - q.q1, 10);
  });

  it('is not the (n+1)/2 rule, which belongs to an ordered list', () => {
    // With n = 40 the two rules disagree, and mixing them is the classic lost mark. Pinning the
    // difference means a future "tidy-up" cannot quietly switch the lab to the wrong one.
    const continuous = readAt(BINS, 40 / 2)!;
    const discrete = readAt(BINS, 41 / 2)!;
    expect(continuous).not.toBeCloseTo(discrete, 6);
  });

  it('orders as q1 <= median <= q3 for every shape', () => {
    for (const shape of [
      BINS,
      [
        { from: 0, to: 5, frequency: 20 },
        { from: 5, to: 10, frequency: 1 },
      ],
      [
        { from: 0, to: 5, frequency: 1 },
        { from: 5, to: 10, frequency: 20 },
      ],
    ] as Bin[][]) {
      const q = quartiles(shape)!;
      expect(q.q1).toBeLessThanOrEqual(q.median);
      expect(q.median).toBeLessThanOrEqual(q.q3);
      expect(q.iqr).toBeGreaterThanOrEqual(0);
    }
  });

  it('has nothing to report when there is no data', () => {
    expect(quartiles([])).toBeNull();
    expect(quartiles([{ from: 0, to: 5, frequency: 0 }])).toBeNull();
  });
});

describe('authoring checks', () => {
  it('passes well-formed classes', () => {
    expect(ogiveProblems(BINS)).toEqual([]);
  });

  it('catches a gap between classes, which breaks the curve', () => {
    const gapped: Bin[] = [
      { from: 0, to: 10, frequency: 4 },
      { from: 15, to: 20, frequency: 6 },
    ];
    expect(ogiveProblems(gapped)).toContain('class 1 ends at 10 but class 2 starts at 15');
  });

  it('catches a class that ends before it starts, and a negative frequency', () => {
    expect(ogiveProblems([{ from: 10, to: 5, frequency: 1 }])).toContain(
      'class 1 ends at or before it starts',
    );
    expect(
      ogiveProblems([
        { from: 0, to: 5, frequency: -2 },
        { from: 5, to: 10, frequency: 1 },
      ]),
    ).toContain('class 1 has a negative frequency');
  });
});
