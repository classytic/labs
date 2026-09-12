import { describe, expect, it } from 'vitest';
import {
  ambiguityNote,
  area,
  areaFrom,
  ruleFor,
  solveAAS,
  solveSAS,
  solveSSA,
  solveSSS,
  triangleProblems,
  vertices,
} from '../src/math/oblique-triangle/core.js';

/** Angles of every solved triangle must sum to 180, or the drawing is a lie. */
const closes = (t: { A: number; B: number; C: number }): void => {
  expect(t.A + t.B + t.C).toBeCloseTo(180, 9);
  expect(Math.min(t.A, t.B, t.C)).toBeGreaterThan(0);
};

describe('choosing the rule, which is the whole decision', () => {
  it('sends three sides and two-sides-with-the-angle-between to the cosine rule', () => {
    expect(ruleFor('sss').rule).toBe('cosine');
    expect(ruleFor('sas').rule).toBe('cosine');
  });

  it('sends anything with a matching pair to the sine rule', () => {
    expect(ruleFor('aas').rule).toBe('sine');
    expect(ruleFor('ssa').rule).toBe('sine');
  });

  it('explains the choice by the matching pair, not by the case name', () => {
    // A learner who memorises "SAS means cosine" is stuck on a worded question. The reason has to
    // travel with the answer, so pin that the reason mentions the pair rather than the letters.
    expect(ruleFor('sas').why).toMatch(/pair/i);
    expect(ruleFor('aas').why).toMatch(/pair/i);
  });
});

describe('the cosine rule', () => {
  it('finds an angle from three sides', () => {
    // The 3-4-5 right triangle: the angle facing 5 must come out at exactly 90.
    const t = solveSSS(3, 4, 5)!;
    expect(t.C).toBeCloseTo(90, 9);
    expect(t.A).toBeCloseTo(36.8699, 3);
    closes(t);
  });

  it('finds an obtuse angle without the sine rule folding it to acute', () => {
    // Sides 5, 6, 10 force an obtuse angle facing 10. arccos returns it directly; a sine-rule
    // route would have returned its acute partner and silently drawn the wrong triangle.
    const t = solveSSS(5, 6, 10)!;
    expect(t.C).toBeGreaterThan(90);
    expect(t.C).toBeCloseTo(130.5416, 3); // cos C = (25 + 36 - 100)/60 = -0.65
    closes(t);
  });

  it('refuses three sides that cannot close', () => {
    expect(solveSSS(1, 2, 10)).toBeNull();
    expect(solveSSS(1, 2, 3)).toBeNull(); // degenerate: a straight line, not a triangle
    expect(solveSSS(0, 4, 5)).toBeNull();
  });

  it('finds the third side from two sides and the angle between them', () => {
    // b = 8, A = 60 between them, c = 5  =>  a^2 = 64 + 25 - 2*8*5*0.5 = 49
    const t = solveSAS(8, 60, 5)!;
    expect(t.a).toBeCloseTo(7, 9);
    closes(t);
  });

  it('keeps the included angle facing the side it computed', () => {
    const t = solveSAS(8, 60, 5)!;
    expect(t.A).toBe(60);
    // The largest angle must face the largest side. Here that is b = 8.
    expect(t.B).toBeGreaterThan(t.A);
    expect(t.B).toBeGreaterThan(t.C);
  });
});

describe('the sine rule', () => {
  it('solves two angles and a side', () => {
    const t = solveAAS(40, 60, 10)!;
    expect(t.C).toBeCloseTo(80, 9);
    // a/sin A is the shared ratio the rule asserts; every side must reproduce it.
    const k = 10 / Math.sin((40 * Math.PI) / 180);
    expect(t.b / Math.sin((60 * Math.PI) / 180)).toBeCloseTo(k, 9);
    expect(t.c / Math.sin((80 * Math.PI) / 180)).toBeCloseTo(k, 9);
    closes(t);
  });

  it('rejects two angles that already use up 180 degrees', () => {
    expect(solveAAS(100, 80, 5)).toBeNull();
    expect(solveAAS(120, 70, 5)).toBeNull();
  });
});

describe('the ambiguous case, where the marks are lost', () => {
  it('returns TWO triangles when the side reaches the base twice', () => {
    // a = 8, b = 10, A = 40. Height h = 10 sin40 = 6.43, and 6.43 < 8 < 10, so two triangles.
    const both = solveSSA(8, 10, 40);
    expect(both).toHaveLength(2);
    const [acute, obtuse] = both;
    expect(acute!.B).toBeCloseTo(53.4641, 3); // asin(10 sin40 / 8)
    expect(obtuse!.B).toBeCloseTo(180 - 53.4641, 3);
    both.forEach(closes);
  });

  it('gives the two triangles the SAME given parts and different third sides', () => {
    // This is what makes the case ambiguous rather than merely two answers: the given data is
    // genuinely identical, so no amount of care with the given numbers separates them.
    const [one, two] = solveSSA(8, 10, 40);
    expect(one!.a).toBe(two!.a);
    expect(one!.b).toBe(two!.b);
    expect(one!.A).toBe(two!.A);
    expect(one!.c).not.toBeCloseTo(two!.c, 3);
  });

  it('returns ONE triangle when the opposite side is long enough to overshoot', () => {
    // a = 12 >= b = 10, so the far crossing falls behind A and is not a triangle.
    expect(solveSSA(12, 10, 40)).toHaveLength(1);
  });

  it('returns NO triangle when the side cannot reach the base', () => {
    // h = 10 sin 40 = 6.43, and a = 5 is shorter than that.
    expect(solveSSA(5, 10, 40)).toHaveLength(0);
  });

  it('returns one right-angled triangle when the side is exactly the height', () => {
    const h = 10 * Math.sin((40 * Math.PI) / 180);
    const only = solveSSA(h, 10, 40);
    expect(only).toHaveLength(1);
    expect(only[0]!.B).toBeCloseTo(90, 6);
  });

  it('never gives two triangles when the given angle is obtuse', () => {
    // An obtuse angle faces the longest side, so its partner 180 - B leaves no room for a third
    // angle. A solver that just takes both roots of sin B would emit a triangle summing past 180.
    for (const a of [11, 14, 20]) expect(solveSSA(a, 10, 120)).toHaveLength(1);
  });

  it('names the reason for the count in each of the four situations', () => {
    expect(ambiguityNote(5, 10, 40)).toMatch(/No triangle/);
    expect(ambiguityNote(8, 10, 40)).toMatch(/TWO triangles/);
    expect(ambiguityNote(12, 10, 40)).toMatch(/One triangle/);
    expect(ambiguityNote(11, 10, 120)).toMatch(/not acute/);
  });
});

describe('area without a perpendicular height', () => {
  it('uses two sides and the angle between them', () => {
    // Half of 6 times 8 is 24, and sin 90 = 1, so the right-angled case must agree with base*height/2.
    expect(areaFrom(6, 90, 8)).toBeCloseTo(24, 9);
    expect(areaFrom(6, 30, 8)).toBeCloseTo(12, 9);
  });

  it('agrees with Heron on a solved triangle', () => {
    // An independent formula, so this catches a wrong pairing of side and angle in `area`.
    const t = solveSSS(7, 9, 12)!;
    const s = (7 + 9 + 12) / 2;
    expect(area(t)).toBeCloseTo(Math.sqrt(s * (s - 7) * (s - 9) * (s - 12)), 8);
  });
});

describe('drawing', () => {
  it('places A at the origin with side c along the x-axis', () => {
    const v = vertices(solveSAS(8, 60, 5)!);
    expect(v.A).toEqual([0, 0]);
    expect(v.B[1]).toBe(0);
    expect(v.C[1]).toBeGreaterThan(0);
  });

  it('reproduces the side lengths it was given', () => {
    const t = solveSSS(7, 9, 12)!;
    const v = vertices(t);
    const dist = (p: [number, number], q: [number, number]): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
    expect(dist(v.A, v.B)).toBeCloseTo(t.c, 8); // c faces C, so it joins A to B
    expect(dist(v.A, v.C)).toBeCloseTo(t.b, 8);
    expect(dist(v.B, v.C)).toBeCloseTo(t.a, 8);
  });

  it('draws the two ambiguous triangles hinged on the same swing', () => {
    // Same vertex A, same direction for side b, different foot on the base. That shared frame is
    // what makes the two solutions read as one side swinging, rather than two unrelated answers.
    const [one, two] = solveSSA(8, 10, 40).map(vertices);
    expect(one!.C).toEqual(two!.C);
    expect(one!.B[0]).not.toBeCloseTo(two!.B[0], 3);
  });
});

describe('authoring checks', () => {
  it('passes well-formed data', () => {
    expect(triangleProblems('sss', [7, 9, 12])).toEqual([]);
    expect(triangleProblems('ssa', [8, 10, 40])).toEqual([]);
  });

  it('catches sides that cannot close and data that draws nothing', () => {
    expect(triangleProblems('sss', [1, 2, 10])[0]).toMatch(/cannot close/);
    expect(triangleProblems('ssa', [5, 10, 40])[0]).toMatch(/no triangle/);
    expect(triangleProblems('aas', [100, 90, 5])[0]).toMatch(/less than 180/);
  });
});
