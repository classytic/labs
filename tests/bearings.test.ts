import { describe, expect, it } from 'vitest';
import {
  backBearing,
  bearingBetween,
  bearingProblems,
  formatBearing,
  journey,
  legEnd,
  norm360,
  resultant,
  turnAngle,
  type Leg,
  type Point,
} from '../src/math/bearings/core.js';

const ORIGIN: Point = { east: 0, north: 0 };

describe('the three-figure form, which is a mark on its own', () => {
  it('always prints three figures', () => {
    expect(formatBearing(45)).toBe('045°');
    expect(formatBearing(5)).toBe('005°');
    expect(formatBearing(180)).toBe('180°');
    expect(formatBearing(0)).toBe('000°');
  });

  it('keeps three whole figures when there is a decimal', () => {
    // Padding the finished decimal string would give "45.5" three characters before the point only
    // by accident; the whole part has to be padded on its own.
    expect(formatBearing(45.5)).toBe('045.5°');
    expect(formatBearing(5.2)).toBe('005.2°');
  });

  it('folds angles outside a turn back into range', () => {
    expect(formatBearing(370)).toBe('010°');
    expect(formatBearing(-90)).toBe('270°');
    expect(norm360(-1)).toBe(359);
  });
});

describe('bearings measure clockwise from North, not anticlockwise from East', () => {
  it('sends 000 due north and 090 due east', () => {
    const north = legEnd(ORIGIN, 0, 10);
    expect(north.north).toBeCloseTo(10, 9);
    expect(north.east).toBeCloseTo(0, 9);

    const east = legEnd(ORIGIN, 90, 10);
    expect(east.east).toBeCloseTo(10, 9);
    expect(east.north).toBeCloseTo(0, 9);
  });

  it('sends 180 south and 270 west, so the turn really is clockwise', () => {
    // If sin and cos were not swapped, or the rotation ran the other way, 270 would land East.
    expect(legEnd(ORIGIN, 180, 5).north).toBeCloseTo(-5, 9);
    expect(legEnd(ORIGIN, 270, 5).east).toBeCloseTo(-5, 9);
  });

  it('reads a bearing back off two points', () => {
    expect(bearingBetween(ORIGIN, { east: 0, north: 1 })).toBeCloseTo(0, 9);
    expect(bearingBetween(ORIGIN, { east: 1, north: 0 })).toBeCloseTo(90, 9);
    expect(bearingBetween(ORIGIN, { east: 1, north: 1 })).toBeCloseTo(45, 9);
    expect(bearingBetween(ORIGIN, { east: -1, north: 1 })).toBeCloseTo(315, 9);
  });

  it('round-trips: steer a bearing, then read it back', () => {
    for (const b of [0, 37, 90, 145, 180, 233, 270, 359]) {
      expect(bearingBetween(ORIGIN, legEnd(ORIGIN, b, 7))).toBeCloseTo(b, 6);
    }
  });
});

describe('the back bearing', () => {
  it('adds or subtracts 180 to stay in range', () => {
    expect(backBearing(50)).toBe(230);
    expect(backBearing(230)).toBe(50);
    expect(backBearing(0)).toBe(180);
  });

  it('is exactly the bearing read the other way between the same two points', () => {
    // This is the property the rule encodes, so testing it against the geometry rather than against
    // "+180" catches a back bearing that happens to be right only for acute bearings.
    const p: Point = { east: 3, north: 4 };
    expect(backBearing(bearingBetween(ORIGIN, p))).toBeCloseTo(bearingBetween(p, ORIGIN), 9);
  });
});

describe('a journey, which is a triangle', () => {
  const LEGS: Leg[] = [
    { bearing: 60, distance: 8 },
    { bearing: 150, distance: 6 },
  ];

  it('visits every corner including where it started', () => {
    const points = journey(ORIGIN, LEGS);
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual(ORIGIN);
  });

  it('turns through a right angle when the bearings differ by 90', () => {
    // 060 then 150 is a 90 degree turn, so the direct distance must be the hypotenuse of 8 and 6.
    expect(resultant(ORIGIN, LEGS).distance).toBeCloseTo(10, 9);
  });

  it('agrees with the cosine rule, which is the method a candidate has to write down', () => {
    const legs: Leg[] = [
      { bearing: 30, distance: 9 },
      { bearing: 100, distance: 5 },
    ];
    const angle = turnAngle(legs[0]!, legs[1]!);
    const byCosineRule = Math.sqrt(9 * 9 + 5 * 5 - 2 * 9 * 5 * Math.cos((angle * Math.PI) / 180));
    expect(resultant(ORIGIN, legs).distance).toBeCloseTo(byCosineRule, 8);
  });

  it('gives the interior angle at the turn, not the difference of the bearings', () => {
    // 030 then 100 differ by 70, but the angle INSIDE the triangle is 110. A candidate who
    // subtracts the bearings gets a plausible number and the wrong triangle, which is the whole
    // reason this is a separate function.
    const angle = turnAngle({ bearing: 30, distance: 9 }, { bearing: 100, distance: 5 });
    expect(angle).toBeCloseTo(110, 9);
    expect(angle).not.toBeCloseTo(70, 6);
  });

  it('reports the way home as the back bearing of the way out', () => {
    const r = resultant(ORIGIN, LEGS);
    expect(r.homeBearing).toBeCloseTo(backBearing(r.bearing), 9);
  });

  it('never reports an interior angle outside a triangle', () => {
    for (let first = 0; first < 360; first += 17) {
      for (let second = 0; second < 360; second += 23) {
        const angle = turnAngle({ bearing: first, distance: 5 }, { bearing: second, distance: 5 });
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('authoring checks', () => {
  it('passes a well-formed journey', () => {
    expect(bearingProblems([{ bearing: 60, distance: 8 }])).toEqual([]);
  });

  it('catches a leg that goes nowhere', () => {
    expect(bearingProblems([{ bearing: 60, distance: 0 }])[0]).toMatch(/zero or negative/);
    expect(bearingProblems([])[0]).toMatch(/at least one leg/);
  });
});
