/**
 * Projectile motion — the MODEL: composes the formulas into the results a renderer or
 * an agent consumes (summary numbers, the sampled arc, a position at time t, the landing
 * outcome). Still pure — this is the single source of truth for "what the physics says",
 * independent of how it is drawn.
 */

import type { ProjectileInput, ProjectileResult, Point, LandingResult } from './types.js';
import { velocityComponents, range, peakHeight, timeOfFlight, positionAt } from './formulas.js';

/** The summary quantities for a launch. */
export function computeProjectile(input: ProjectileInput): ProjectileResult {
  const { vx, vy } = velocityComponents(input.speed, input.angleDeg);
  return {
    vx,
    vy,
    range: range(vx, vy, input.g),
    peak: peakHeight(vy, input.g),
    timeOfFlight: timeOfFlight(vy, input.g),
  };
}

/** The flight path, sampled into `samples` points from launch to landing. */
export function sampleArc(input: ProjectileInput, samples = 60): Point[] {
  const { vx, vy } = velocityComponents(input.speed, input.angleDeg);
  const tof = timeOfFlight(vy, input.g);
  const step = tof / samples || 1;
  const pts: Point[] = [];
  for (let t = 0; t <= tof + 1e-9; t += step) pts.push(positionAt(vx, vy, input.g, t));
  return pts;
}

/** The projectile's position at time t (clamped to the flight duration). */
export function projectileAt(input: ProjectileInput, t: number): Point {
  const { vx, vy } = velocityComponents(input.speed, input.angleDeg);
  const tof = timeOfFlight(vy, input.g);
  return positionAt(vx, vy, input.g, Math.min(t, tof));
}

/** Did the shot land on the target (within `tolerance` metres)? */
export function landing(input: ProjectileInput, target: number, tolerance = 4): LandingResult {
  const { vx, vy } = velocityComponents(input.speed, input.angleDeg);
  const landedX = vx * timeOfFlight(vy, input.g);
  const error = Math.abs(landedX - target);
  return { landedX, error, hit: error <= tolerance };
}
