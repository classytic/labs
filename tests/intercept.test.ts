import { describe, expect, it } from 'vitest';
import { chaseRun, intercept, offCourse, straightRun, type Chase } from '../src/physics/intercept/core.js';

/** A deer 40 m ahead of the tiger, crossing east at 14 m/s; a tiger at 18 m/s with a 4.5 s sprint. */
const CHASE: Chase = {
  chaser: { x: 0, y: 0 },
  chaserSpeed: 18,
  quarry: { x: 0, y: 40 },
  quarryVelocity: { x: 14, y: 0 },
  catchRadius: 1.5,
  stamina: 4.5,
};

describe('the straight-line intercept', () => {
  it('solves the meeting quadratic', () => {
    // (14² − 18²) t² + 40² = 0, so 128 t² = 1600 and t = √12.5.
    const i = intercept(CHASE);
    expect(i).not.toBeNull();
    expect(i!.time).toBeCloseTo(Math.sqrt(12.5), 10);
    expect(i!.point.y).toBeCloseTo(40, 10);
    // At the meeting point, the tiger has run exactly speed × time.
    expect(Math.hypot(i!.point.x, i!.point.y)).toBeCloseTo(18 * i!.time, 8);
  });

  it('catches the deer on that heading', () => {
    const i = intercept(CHASE)!;
    const run = straightRun(CHASE, i.heading);
    expect(run.caught).toBe(true);
    expect(run.time).toBeLessThan(i.time);
  });

  it('misses if the tiger runs at where the deer is now', () => {
    const atDeer = 90; // straight at the deer's starting position, due north
    const run = straightRun(CHASE, atDeer);
    expect(run.caught).toBe(false);
    expect(run.closest).toBeGreaterThan(10);
  });

  it('puts the relative velocity on the line of sight exactly when on course', () => {
    const i = intercept(CHASE)!;
    expect(offCourse(CHASE, i.heading)).toBeCloseTo(0, 8);
    expect(Math.abs(offCourse(CHASE, i.heading + 10))).toBeGreaterThan(1);
  });

  it('has no straight intercept when the deer is faster and running away', () => {
    expect(intercept({ ...CHASE, chaserSpeed: 8, quarry: { x: 40, y: 0 } })).toBeNull();
  });
});

describe('chasing', () => {
  it('eventually catches a slower deer, but later than the intercept', () => {
    const long = chaseRun({ ...CHASE, stamina: 60 });
    expect(long.caught).toBe(true);
    expect(long.time).toBeGreaterThan(intercept(CHASE)!.time);
  });

  it('runs out of sprint before the catch, where the straight run does not', () => {
    // The whole lesson in one comparison: same tiger, same deer, same 4.5 seconds.
    expect(chaseRun(CHASE).caught).toBe(false);
    expect(chaseRun(CHASE).reason).toBe('stamina');
    expect(straightRun(CHASE, intercept(CHASE)!.heading).caught).toBe(true);
  });
});
