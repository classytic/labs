import { describe, expect, it } from 'vitest';
import {
  circularOrbitSpeed,
  ellipseStateAtMeanAnomaly,
  gravitationalAcceleration,
  inverseSquareForce,
  keplerPeriod,
  launchState,
  solveEccentricAnomaly,
  specificOrbitalEnergy,
  stepTwoBody,
} from '../src/physics/orbital/core.js';

describe('orbital core', () => {
  it('quarters inverse-square force when distance doubles', () => {
    const force = inverseSquareForce(60, 5, 2, 3);
    expect(inverseSquareForce(60, 5, 2, 6)).toBeCloseTo(force / 4);
  });

  it('obeys action-reaction symmetry and test-mass-independent acceleration', () => {
    expect(inverseSquareForce(1, 4, 7, 3)).toBe(inverseSquareForce(1, 7, 4, 3));
    expect(gravitationalAcceleration(1, 4, 3)).toBeCloseTo(inverseSquareForce(1, 4, 2, 3) / 2);
  });

  it('reduces circular orbital speed by sqrt(2) when radius doubles', () => {
    const speed = circularOrbitSpeed(1, 10, 4);
    expect(circularOrbitSpeed(1, 10, 8)).toBeCloseTo(speed / Math.sqrt(2));
  });

  it('solves Kepler equation across lesson eccentricities and wrapped anomalies', () => {
    for (const eccentricity of [0, 0.5, 0.85])
      for (const mean of [0, 0.2, Math.PI, 2 * Math.PI + 0.7]) {
        const anomaly = solveEccentricAnomaly(mean, eccentricity);
        expect(anomaly - eccentricity * Math.sin(anomaly)).toBeCloseTo(mean, 9);
      }
  });

  it('places periapsis and apoapsis at a(1-e) and a(1+e)', () => {
    const peri = ellipseStateAtMeanAnomaly(4, 0.5, 0);
    const apo = ellipseStateAtMeanAnomaly(4, 0.5, Math.PI);
    expect(peri.radius).toBeCloseTo(2);
    expect(apo.radius).toBeCloseTo(6);
    expect(Math.hypot(peri.x, peri.y)).toBeCloseTo(peri.radius);
    expect(Math.hypot(apo.x, apo.y)).toBeCloseTo(apo.radius);
  });

  it('keeps T squared over a cubed constant', () => {
    const t1 = keplerPeriod(3, 1.6);
    const t2 = keplerPeriod(5, 1.6);
    expect(t1 ** 2 / 3 ** 3).toBeCloseTo(t2 ** 2 / 5 ** 3);
  });

  it('classifies bound and escape launches by specific energy', () => {
    expect(specificOrbitalEnergy(launchState(1, 1, 1), 1)).toBeLessThan(0);
    expect(specificOrbitalEnergy(launchState(1, Math.sqrt(2), 1), 1)).toBeCloseTo(0);
    expect(specificOrbitalEnergy(launchState(1, 1.5, 1), 1)).toBeGreaterThan(0);
  });

  it('keeps a circular model-space orbit bounded with low radial drift', () => {
    let state = launchState(1, 1, 1);
    let min = Infinity,
      max = 0;
    for (let index = 0; index < 20_000; index++) {
      state = stepTwoBody(state, 1, 0.001);
      const radius = Math.hypot(state.x, state.y);
      min = Math.min(min, radius);
      max = Math.max(max, radius);
    }
    expect(max - min).toBeLessThan(0.003);
  });

  it('produces outcomes from model radii, independent of render viewport', () => {
    const outcome = (ratio: number): string => {
      let state = launchState(1, ratio, 1);
      for (let index = 0; index < 100_000; index++) {
        state = stepTwoBody(state, 1, 0.002);
        const radius = Math.hypot(state.x, state.y);
        if (radius <= 0.16) return 'crashed';
        if (radius >= 2.5 && state.x * state.vx + state.y * state.vy > 0) return 'escaped';
      }
      return 'bound';
    };
    expect(outcome(0.5)).toBe('crashed');
    expect(outcome(1)).toBe('bound');
    expect(outcome(1.5)).toBe('escaped');
  });
});
