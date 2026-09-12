import { describe, expect, it } from 'vitest';
import { measurementProbability, qubitState } from '../src/physics/modern/quantum/qubit-core.js';
describe('qubit state engine', () => {
  it('normalizes amplitudes and Bloch vector', () => {
    const s = qubitState(1.2, 2.3);
    expect(s.alpha.re ** 2 + s.beta.re ** 2 + s.beta.im ** 2).toBeCloseTo(1);
    expect(s.x ** 2 + s.y ** 2 + s.z ** 2).toBeCloseTo(1);
  });
  it('maps basis states', () => {
    expect(measurementProbability(qubitState(0, 0), 'z')).toBeCloseTo(1);
    expect(measurementProbability(qubitState(Math.PI, 0), 'z')).toBeCloseTo(0);
    expect(measurementProbability(qubitState(Math.PI / 2, 0), 'x')).toBeCloseTo(1);
  });
  it('keeps phase invisible in Z but visible in X and Y', () => {
    const a = qubitState(Math.PI / 2, 0),
      b = qubitState(Math.PI / 2, Math.PI / 2);
    expect(measurementProbability(a, 'z')).toBeCloseTo(measurementProbability(b, 'z'));
    expect(measurementProbability(a, 'x')).not.toBeCloseTo(measurementProbability(b, 'x'));
  });
});
