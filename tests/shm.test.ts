import { describe, expect, it } from 'vitest';
import {
  oscillatorPeriod,
  sampleOscillator,
  smallAnglePendulumOmega,
  springOmega,
} from '../src/physics/shm/core.js';

describe('SHM model', () => {
  it('samples the expected quarter-period landmarks', () => {
    const omega = springOmega(8, 2),
      period = oscillatorPeriod(omega),
      amplitude = 3;
    expect(sampleOscillator(amplitude, omega, 0).displacement).toBeCloseTo(amplitude);
    expect(sampleOscillator(amplitude, omega, period / 4).displacement).toBeCloseTo(0, 10);
    expect(sampleOscillator(amplitude, omega, period / 2).displacement).toBeCloseTo(-amplitude, 10);
  });

  it('conserves normalized energy and obeys a = −ω²x', () => {
    const omega = springOmega(12, 1.5);
    for (const t of [0, 0.1, 0.5, 1, 5]) {
      const s = sampleOscillator(2, omega, t);
      expect(s.potentialFraction + s.kineticFraction).toBeCloseTo(1, 12);
      expect(s.acceleration).toBeCloseTo(-omega * omega * s.displacement, 12);
    }
  });

  it('has the correct parameter scaling', () => {
    expect(oscillatorPeriod(springOmega(8, 4)) / oscillatorPeriod(springOmega(8, 1))).toBeCloseTo(2);
    expect(oscillatorPeriod(smallAnglePendulumOmega(2, 9.8))).toBeCloseTo(2 * Math.PI * Math.sqrt(2 / 9.8));
  });
});
