/**
 * Projectile physics — runs with NO browser (no React/DOM/canvas import). This is the
 * payoff of keeping formulas in core/: the equations are unit-tested directly, fast, and
 * the same functions could run in a worker, on the server, or from an AI agent.
 */
import { describe, it, expect } from 'vitest';
import {
  computeProjectile,
  sampleArc,
  projectileAt,
  landing,
} from '../../../../src/domains/physics/projectile-lab/core/model.js';
import { launches } from './fixtures.js';

describe('projectile core (browser-free)', () => {
  it('computes range / peak / time-of-flight for known launches', () => {
    for (const c of launches) {
      const r = computeProjectile(c.input);
      expect(r.range, `${c.name} range`).toBeCloseTo(c.range, 1);
      expect(r.peak, `${c.name} peak`).toBeCloseTo(c.peak, 1);
      expect(r.timeOfFlight, `${c.name} tof`).toBeCloseTo(c.tof, 1);
    }
  });

  it('samples an arc that starts and ends on the ground and never dips below it', () => {
    const arc = sampleArc({ angleDeg: 45, speed: 28, g: 9.8 }, 60);
    expect(arc.length).toBeGreaterThan(10);
    expect(arc[0]!.y).toBeCloseTo(0, 5);
    expect(arc.at(-1)!.y).toBeCloseTo(0, 1);
    for (const p of arc) expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it('projectileAt apexes at half the flight time and clamps past landing', () => {
    const input = { angleDeg: 90, speed: 20, g: 10 };
    expect(projectileAt(input, 2).y).toBeCloseTo(20, 5); // apex at t = tof/2
    expect(projectileAt(input, 4).y).toBeCloseTo(0, 5); // landing
    expect(projectileAt(input, 99).y).toBeCloseTo(0, 5); // clamped to tof
  });

  it('landing flags a hit only within tolerance', () => {
    const input = { angleDeg: 45, speed: 28, g: 9.8 };
    expect(landing(input, 80, 4).hit).toBe(true);
    expect(landing(input, 70, 4).hit).toBe(false);
    expect(landing(input, 70, 4).error).toBeCloseTo(10, 0);
  });
});
