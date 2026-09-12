import { describe, expect, it } from 'vitest';
import { lengthContractionState } from '../src/physics/modern/relativity/length-core.js';
describe('length contraction engine', () => {
  it('returns proper length at rest', () =>
    expect(lengthContractionState(0, 100).contractedLengthM).toBeCloseTo(100));
  it('contracts by gamma', () => {
    const s = lengthContractionState(0.8, 100);
    expect(s.gamma).toBeCloseTo(5 / 3);
    expect(s.contractedLengthM).toBeCloseTo(60);
  });
  it('uses simultaneous platform endpoint events', () => {
    const s = lengthContractionState(0.8);
    expect(s.platformEvents.front.ct).toBe(s.platformEvents.rear.ct);
    expect(Math.abs(s.rodEvents.front.ct - s.rodEvents.rear.ct)).toBeGreaterThan(1e-10);
  });
  it('is symmetric in velocity magnitude', () =>
    expect(lengthContractionState(-0.7).contractedLengthM).toBeCloseTo(
      lengthContractionState(0.7).contractedLengthM,
    ));
});
