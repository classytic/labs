import { describe, expect, it } from 'vitest';
import { bindingState, NUCLIDES } from '../src/physics/modern/nuclear/core.js';
describe('nuclear binding engine', () => {
  it('matches accepted helium-4 binding energy', () =>
    expect(bindingState(NUCLIDES.helium4).bindingEnergyMeV).toBeCloseTo(28.3, 1));
  it('places iron above uranium per nucleon', () =>
    expect(bindingState(NUCLIDES.iron56).perNucleonMeV).toBeGreaterThan(
      bindingState(NUCLIDES.uranium235).perNucleonMeV,
    ));
  it('uses positive mass defect', () =>
    Object.values(NUCLIDES).forEach((n) => expect(bindingState(n).massDefectU).toBeGreaterThan(0)));
});
