import { describe, expect, it } from 'vitest';
import {
  atwoodState,
  circularMotionState,
  collisionResult,
  energySnapshot,
  halfSinePeakForce,
  halfSinePulse,
  parabolicTrackHeight,
  penetrationResult,
  rampForceState,
  stoppingMetrics,
  stoppingPositionAt,
  stoppingSpeedAt,
  terminalVelocityState,
} from '../src/physics/mechanics/core.js';

describe('mechanics core', () => {
  it('constructs a symmetric parabolic track with the requested lip height', () => {
    expect(parabolicTrackHeight(0, 6, 5)).toBe(0);
    expect(parabolicTrackHeight(-6, 6, 5)).toBe(5);
    expect(parabolicTrackHeight(6, 6, 5)).toBe(5);
  });

  it('conserves the complete PE + KE + thermal energy account', () => {
    const snapshot = energySnapshot(49, 1, 9.8, 2, 7);
    expect(snapshot.potential).toBeCloseTo(19.6);
    expect(snapshot.kinetic).toBeCloseTo(22.4);
    expect(snapshot.thermal).toBe(7);
    expect(snapshot.total).toBeCloseTo(49);
  });

  it('does not expose negative kinetic energy beyond a turning point', () => {
    const snapshot = energySnapshot(20, 1, 10, 3, 0);
    expect(snapshot.kinetic).toBe(0);
    expect(snapshot.potential).toBe(20);
    expect(snapshot.total).toBe(20);
  });

  it('conserves momentum for every restitution and KE for elastic collisions', () => {
    for (const e of [0, 0.25, 0.5, 1]) {
      const result = collisionResult(2, 3, 5, -1, e);
      expect(result.momentumAfter).toBeCloseTo(result.momentumBefore, 10);
      expect(result.kineticAfter).toBeLessThanOrEqual(result.kineticBefore + 1e-10);
      if (e === 1) expect(result.kineticAfter).toBeCloseTo(result.kineticBefore, 10);
    }
  });

  it('makes both bodies share velocity in a perfectly inelastic collision', () => {
    const result = collisionResult(1, 2, 4, -1, 0);
    expect(result.velocity1).toBeCloseTo(result.velocity2);
  });

  it('keeps impulse fixed while longer contact lowers peak force', () => {
    expect(halfSinePeakForce(4, 0.2)).toBeCloseTo(halfSinePeakForce(4, 0.1) / 2);
    const points = halfSinePulse(4, 0.2, 2000);
    const dx = 0.2 / 2000;
    const area = points.reduce(
      (sum, point, index) => (index ? sum + ((points[index - 1]!.y + point.y) * dx) / 2 : sum),
      0,
    );
    expect(area).toBeCloseTo(4, 5);
  });

  it('rejects a zero-duration impulse pulse', () => {
    expect(() => halfSinePeakForce(4, 0)).toThrow(RangeError);
  });

  it('preserves circular-motion scaling laws', () => {
    const base = circularMotionState(2, 3, 4);
    expect(circularMotionState(2, 6, 4).centripetalForce).toBeCloseTo(base.centripetalForce * 4);
    expect(circularMotionState(2, 3, 8).centripetalForce).toBeCloseTo(base.centripetalForce / 2);
    expect(base.period).toBeCloseTo((2 * Math.PI * 4) / 3);
  });

  it('balances equal Atwood masses and preserves the rope-force equations', () => {
    expect(atwoodState(3, 3).acceleration).toBe(0);
    expect(atwoodState(3, 3).tension).toBeCloseTo(3 * 9.8);
    const state = atwoodState(3, 2);
    expect(3 * 9.8 - state.tension).toBeCloseTo(3 * state.acceleration);
    expect(state.tension - 2 * 9.8).toBeCloseTo(2 * state.acceleration);
  });

  it('uses static friction only up to its limit', () => {
    const held = rampForceState(2, 10, Math.PI / 6, 0, 0.7, 0.4);
    expect(held.held).toBe(true);
    expect(held.net).toBe(0);
    expect(held.friction).toBeCloseTo(10);
    const sliding = rampForceState(2, 10, Math.PI / 6, 0, 0.2, 0.1);
    expect(sliding.held).toBe(false);
    expect(sliding.friction).toBeGreaterThan(0);
    expect(sliding.net).toBeLessThan(0);
  });

  it('reverses friction when an applied force drives the crate uphill', () => {
    const state = rampForceState(2, 10, Math.PI / 6, 30, 0.2, 0.1);
    expect(state.held).toBe(false);
    expect(state.friction).toBeLessThan(0);
    expect(state.acceleration).toBeGreaterThan(0);
  });

  it('starts a quadratic-drag fall at rest with acceleration g', () => {
    const state = terminalVelocityState(80, 9.8, 0.4, 0);
    expect(state.speed).toBe(0);
    expect(state.dragRatio).toBe(0);
    expect(state.acceleration).toBeCloseTo(9.8);
    expect(state.distance).toBe(0);
  });

  it('approaches terminal speed as drag balances weight', () => {
    const state = terminalVelocityState(80, 9.8, 0.4, 100);
    expect(state.speed).toBeCloseTo(state.terminalSpeed, 8);
    expect(state.dragRatio).toBeCloseTo(1, 8);
    expect(state.acceleration).toBeCloseTo(0, 8);
  });

  it('reduces terminal speed by the square root of added drag', () => {
    const open = terminalVelocityState(80, 9.8, 0.4 * 64, 0);
    const closed = terminalVelocityState(80, 9.8, 0.4, 0);
    expect(open.terminalSpeed).toBeCloseTo(closed.terminalSpeed / 8);
  });

  it('separates linear reaction distance from quadratic braking distance', () => {
    const base = stoppingMetrics(10, 0.7, 5);
    const doubled = stoppingMetrics(20, 0.7, 5);
    expect(doubled.reactionDistance).toBeCloseTo(base.reactionDistance * 2);
    expect(doubled.brakingDistance).toBeCloseTo(base.brakingDistance * 4);
  });

  it('keeps stopping position and speed continuous at brake onset and stop', () => {
    const state = stoppingMetrics(20, 0.7, 5);
    expect(stoppingPositionAt(0.7, 20, 0.7, 5)).toBeCloseTo(state.reactionDistance);
    expect(stoppingSpeedAt(0.7, 20, 0.7, 5)).toBe(20);
    expect(stoppingPositionAt(state.totalDuration, 20, 0.7, 5)).toBeCloseTo(state.totalDistance);
    expect(stoppingSpeedAt(state.totalDuration, 20, 0.7, 5)).toBe(0);
  });

  it('computes full and partial constant-work penetration', () => {
    const lodged = penetrationResult(30, 160, 10);
    expect(lodged.fullPenetrated).toBe(5);
    expect(lodged.remainingSpeedSquared).toBe(100);
    expect(lodged.lodgeFraction).toBeCloseTo(0.625);
    expect(lodged.exitsStack).toBe(false);
  });

  it('treats an exact final-barrier boundary as exiting the stack', () => {
    const exact = penetrationResult(20, 100, 4);
    expect(exact.fullPenetrated).toBe(4);
    expect(exact.remainingSpeedSquared).toBe(0);
    expect(exact.exitsStack).toBe(true);
  });

  it('quadruples theoretical penetration when speed doubles', () => {
    expect(penetrationResult(20, 100, 100).fullPenetrated).toBe(4);
    expect(penetrationResult(40, 100, 100).fullPenetrated).toBe(16);
  });
});
