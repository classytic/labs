import { describe, expect, it } from 'vitest';
import {
  coordinateTime,
  inverseLorentzTransform,
  lightClockEvents,
  lorentzGamma,
  lorentzTransform,
  spacetimeInterval,
} from '../src/physics/modern/relativity/core.js';
describe('special relativity engine', () => {
  it('has the classical limit and expected dilation', () => {
    expect(lorentzGamma(0)).toBe(1);
    expect(lorentzGamma(0.6)).toBeCloseTo(1.25);
    expect(coordinateTime(2, 0.6)).toBeCloseTo(2.5);
  });
  it('round-trips Lorentz transforms and preserves the interval', () => {
    const event = { x: 2.3, ct: 5.1 },
      mapped = lorentzTransform(event, 0.72),
      back = inverseLorentzTransform(mapped, 0.72);
    expect(back.x).toBeCloseTo(event.x);
    expect(back.ct).toBeCloseTo(event.ct);
    expect(spacetimeInterval(mapped)).toBeCloseTo(spacetimeInterval(event));
  });
  it('keeps lightlike intervals zero and the tick ratio equal to gamma', () => {
    expect(spacetimeInterval({ x: 3, ct: 3 })).toBe(0);
    const e = lightClockEvents(0.8, 2);
    expect(e.return.ct / 2).toBeCloseTo(lorentzGamma(0.8));
  });
  it('rejects non-finite beta', () => {
    expect(() => lorentzGamma(Number.NaN)).toThrow(RangeError);
  });
});
