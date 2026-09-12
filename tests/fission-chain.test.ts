import { describe, expect, it } from 'vitest';
import {
  criticalityOf,
  effectiveMultiplication,
  simulateFissionChain,
} from '../src/physics/modern/nuclear/fission-core.js';

describe('conceptual fission engine', () => {
  it('classifies multiplication', () => {
    expect(criticalityOf(0.8)).toBe('subcritical');
    expect(criticalityOf(1)).toBe('critical');
    expect(criticalityOf(1.2)).toBe('supercritical');
  });

  it('control insertion reduces k monotonically', () => {
    const values = [0, 0.2, 0.5, 0.8, 1].map((control) => effectiveMultiplication(1.4, control));
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('generation population follows effective k', () => {
    const state = simulateFissionChain({ baseK: 1.2, controlInsertion: 0, generationCount: 4 });
    expect(state.generations[3]!.sourceNeutrons).toBeCloseTo(1.2 ** 3);
    expect(state.totalExpectedEnergyMeV).toBeGreaterThan(0);
  });

  it('accounts for every source neutron independently of emitted neutrons', () => {
    const state = simulateFissionChain({ baseK: 1.35, controlInsertion: 0.4, generationCount: 6 });
    for (const generation of state.generations) {
      const accounted =
        generation.controlCaptured + generation.leaked + generation.fuelCaptured + generation.fissions;
      expect(accounted).toBeCloseTo(generation.sourceNeutrons, 12);
      expect(generation.emittedNeutrons).toBeCloseTo(generation.fissions * state.neutronsPerFission, 12);
    }
  });

  it('keeps leakage independent while control capture increases', () => {
    const withdrawn = simulateFissionChain({ baseK: 1.35, controlInsertion: 0, generationCount: 1 });
    const inserted = simulateFissionChain({ baseK: 1.35, controlInsertion: 0.8, generationCount: 1 });
    expect(inserted.generations[0]!.controlCaptured).toBeGreaterThan(
      withdrawn.generations[0]!.controlCaptured,
    );
    expect(inserted.leakageFraction).toBe(withdrawn.leakageFraction);
    expect(inserted.generations[0]!.leaked).toBeLessThan(withdrawn.generations[0]!.leaked);
  });

  it('rejects a multiplier impossible for the authored neutron yield', () => {
    expect(() => simulateFissionChain({ baseK: 3, neutronsPerFission: 2.43, leakageFraction: 0.12 })).toThrow(
      RangeError,
    );
  });
});
