import { describe, expect, it } from 'vitest';
import { METALS, photoelectricState } from '../src/physics/modern/quantum/photoelectric-core.js';
describe('photoelectric engine', () => {
  it('matches the 430 nm calcium-style energy balance', () =>
    expect(photoelectricState(430, 2.71).maxKineticEnergyEv).toBeCloseTo(0.17, 1));
  it('has a threshold', () => {
    expect(photoelectricState(700, METALS.sodium.workFunctionEv).emits).toBe(false);
    expect(photoelectricState(400, METALS.sodium.workFunctionEv).emits).toBe(true);
  });
  it('intensity changes current but not electron energy', () => {
    const a = photoelectricState(300, 2.46, 0.2),
      b = photoelectricState(300, 2.46, 0.8);
    expect(a.maxKineticEnergyEv).toBe(b.maxKineticEnergyEv);
    expect(b.relativeCurrent).toBeGreaterThan(a.relativeCurrent);
  });
  it('reverse bias reaches stopping potential', () => {
    const a = photoelectricState(300, 2.46, 1),
      b = photoelectricState(300, 2.46, 1, -a.stoppingPotentialV);
    expect(b.relativeCurrent).toBeCloseTo(0);
  });
});
