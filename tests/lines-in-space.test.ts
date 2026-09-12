import { describe, expect, it } from 'vitest';
import {
  angleBetween,
  clipToSphere,
  cross,
  dot,
  footOfPerpendicular,
  fmt,
  fmtVec,
  lineProblems,
  norm,
  pointAt,
  project,
  relate,
  screenCrossing,
  type Line3,
} from '../src/math/lines-in-space/core.js';

describe('the scalar product and the angle', () => {
  it('finds a · b and the angle from it', () => {
    // a = (3, 1, 2), b = (1, −2, 2): a · b = 3 − 2 + 4 = 5, |a| = √14, |b| = 3.
    expect(dot([3, 1, 2], [1, -2, 2])).toBe(5);
    expect(angleBetween([3, 1, 2], [1, -2, 2])).toBeCloseTo(63.55, 2);
  });

  it('gives 90° exactly when the scalar product is zero', () => {
    expect(dot([3, 1, 2], [0, -2, 1])).toBe(0);
    expect(angleBetween([3, 1, 2], [0, -2, 1])).toBeCloseTo(90, 10);
  });

  it('turns an obtuse angle between directions into the acute angle between lines', () => {
    // Reversing a direction is the same line, so the angle between LINES is never obtuse.
    const obtuse = angleBetween([1, 0, 0], [-1, 1, 0]);
    expect(obtuse).toBeCloseTo(135, 10);
    expect(angleBetween([1, 0, 0], [-1, 1, 0], true)).toBeCloseTo(45, 10);
  });

  it('builds a vector perpendicular to both with the cross product', () => {
    const n = cross([1, 1, 0], [1, -1, 0]);
    expect(dot(n, [1, 1, 0])).toBe(0);
    expect(dot(n, [1, -1, 0])).toBe(0);
  });
});

describe('two lines in space', () => {
  it('finds the meeting point of two intersecting lines', () => {
    // l1 = (1, 2, 3) + s(1, 0, −1), l2 = (0, 0, 2) + t(1, 1, 0) meet at (2, 2, 2): s = 1, t = 2.
    const l1: Line3 = { point: [1, 2, 3], direction: [1, 0, -1] };
    const l2: Line3 = { point: [0, 0, 2], direction: [1, 1, 0] };
    const r = relate(l1, l2);
    expect(r.relation).toBe('intersect');
    expect(r.s).toBeCloseTo(1, 10);
    expect(r.t).toBeCloseTo(2, 10);
    expect(r.point?.[0]).toBeCloseTo(2, 10);
    expect(r.point?.[1]).toBeCloseTo(2, 10);
    expect(r.point?.[2]).toBeCloseTo(2, 10);
    expect(r.distance).toBe(0);
  });

  it('calls two non-parallel lines that miss each other skew, and says by how much', () => {
    // Seen from above, (s, s, 1) and (t, 4 − t, 3) cross at (2, 2). They are 2 apart vertically.
    const l1: Line3 = { point: [0, 0, 1], direction: [1, 1, 0] };
    const l2: Line3 = { point: [0, 4, 3], direction: [1, -1, 0] };
    const r = relate(l1, l2);
    expect(r.relation).toBe('skew');
    expect(r.distance).toBeCloseTo(2, 10);
    expect(r.point).toBeNull();
    expect(r.angle).toBeCloseTo(90, 10);
    // The joining segment is perpendicular to both lines: that is what "closest" means.
    const join = [
      r.closest[1][0] - r.closest[0][0],
      r.closest[1][1] - r.closest[0][1],
      r.closest[1][2] - r.closest[0][2],
    ] as const;
    expect(dot(join, l1.direction)).toBeCloseTo(0, 10);
    expect(dot(join, l2.direction)).toBeCloseTo(0, 10);
  });

  it('matches the exam method of solving two equations and testing the third', () => {
    // l1 = (1, 1, 0) + s(2, 1, 1), l2 = (3, 0, 4) + t(1, 1, −1).
    // y: 1 + s = t. x: 1 + 2s = 3 + t = 4 + s, so s = 3 and t = 4.
    // z: 0 + 3 = 3 on l1, but 4 − 4 = 0 on l2. The third equation fails, so the lines are skew.
    const l1: Line3 = { point: [1, 1, 0], direction: [2, 1, 1] };
    const l2: Line3 = { point: [3, 0, 4], direction: [1, 1, -1] };
    expect(relate(l1, l2).relation).toBe('skew');
  });

  it('separates parallel lines from the same line written twice', () => {
    const l1: Line3 = { point: [0, 0, 0], direction: [1, 2, 2] };
    const parallel: Line3 = { point: [0, 3, 0], direction: [-2, -4, -4] };
    const same: Line3 = { point: [2, 4, 4], direction: [3, 6, 6] };
    const p = relate(l1, parallel);
    expect(p.relation).toBe('parallel');
    expect(p.angle).toBe(0);
    // Distance from (0, 3, 0) to the line through O along (1, 2, 2): |(0,3,0) × (1,2,2)| / 3 = √45 / 3.
    expect(p.distance).toBeCloseTo(Math.sqrt(45) / 3, 10);
    expect(relate(l1, same).relation).toBe('same');
  });

  it('judges parallel by proportion, not by size', () => {
    const l1: Line3 = { point: [0, 0, 0], direction: [1000, 0, 0] };
    const l2: Line3 = { point: [0, 1, 0], direction: [0.001, 0, 0] };
    expect(relate(l1, l2).relation).toBe('parallel');
  });
});

describe('the foot of the perpendicular', () => {
  it('finds the foot and the shortest distance', () => {
    // P = a + 2b + n with n = (1, 2, 0) perpendicular to b = (2, −1, 2), so the foot is at t = 2.
    const line: Line3 = { point: [1, 1, 0], direction: [2, -1, 2] };
    const f = footOfPerpendicular([6, 1, 4], line);
    expect(f.t).toBeCloseTo(2, 10);
    expect(f.foot).toEqual(pointAt(line, 2));
    expect(f.distance).toBeCloseTo(Math.sqrt(5), 10);
  });

  it('is where the joining vector is perpendicular to the line', () => {
    const line: Line3 = { point: [1, 0, 0], direction: [1, 2, 2] };
    const p = [5, 3, 1] as const;
    const f = footOfPerpendicular(p, line);
    const pf = [p[0] - f.foot[0], p[1] - f.foot[1], p[2] - f.foot[2]] as const;
    expect(dot(pf, line.direction)).toBeCloseTo(0, 10);
    // And it is the nearest point: moving either way along the line is further away.
    const further = (dt: number): number => {
      const q = pointAt(line, f.t + dt);
      return norm([p[0] - q[0], p[1] - q[1], p[2] - q[2]]);
    };
    expect(further(0.1)).toBeGreaterThan(f.distance);
    expect(further(-0.1)).toBeGreaterThan(f.distance);
  });
});

describe('drawing', () => {
  it('clips a line to the drawing sphere', () => {
    const range = clipToSphere({ point: [0, 0, 0], direction: [1, 0, 0] }, 6);
    expect(range?.[0]).toBeCloseTo(-6, 10);
    expect(range?.[1]).toBeCloseTo(6, 10);
    expect(clipToSphere({ point: [0, 0, 10], direction: [1, 0, 0] }, 6)).toBeNull();
  });

  it('keeps z up and x to the right in the default view', () => {
    expect(project([0, 0, 1], 0, 0).y).toBeCloseTo(1, 10);
    expect(project([1, 0, 0], 0, 0).x).toBeCloseTo(1, 10);
    // Looking down from above, the point above the ground is nearer the viewer.
    expect(project([0, 0, 1], 0, 30).depth).toBeLessThan(0);
  });

  it('never changes a length that lies along the screen', () => {
    // Orthographic: rotation cannot stretch anything, so the sphere keeps its size as it turns.
    for (const [yaw, pitch] of [
      [0, 0],
      [35, 20],
      [-70, 60],
    ] as const) {
      const p = project([3, 4, 12], yaw, pitch);
      expect(Math.hypot(p.x, p.y, p.depth)).toBeCloseTo(13, 10);
    }
  });

  it('finds where two segments cross on screen, which skew lines do too', () => {
    const c = screenCrossing([0, 0], [2, 2], [0, 2], [2, 0]);
    expect(c?.at[0]).toBeCloseTo(1, 10);
    expect(c?.at[1]).toBeCloseTo(1, 10);
    expect(screenCrossing([0, 0], [1, 0], [0, 1], [1, 1])).toBeNull();
  });
});

describe('authoring and display', () => {
  it('rejects a zero direction and a line outside the drawing', () => {
    expect(lineProblems([{ point: [0, 0, 0], direction: [0, 0, 0] }], 6)).toEqual([
      'line 1 has a zero direction vector',
    ]);
    expect(lineProblems([{ point: [0, 0, 9], direction: [1, 0, 0] }], 6)).toHaveLength(1);
    expect(lineProblems([{ point: [1, 1, 0], direction: [2, -1, 2] }], 6)).toEqual([]);
  });

  it('formats without a negative zero', () => {
    expect(fmt(-0.0001)).toBe('0');
    expect(fmtVec([2, -0.5, 1 / 3])).toBe('(2, -0.5, 0.33)');
  });
});
