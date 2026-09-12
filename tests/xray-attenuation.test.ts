import { describe, expect, it } from 'vitest';
import {
  illustrativeMu,
  createXrayPhotonCohort,
  transmittedFraction,
  xrayImageState,
  xrayExposureAt,
} from '../src/physics/modern/imaging/xray-core.js';

describe('X-ray attenuation engine', () => {
  it('implements layered Beer-Lambert attenuation', () => {
    expect(transmittedFraction([{ muCmInv: 0.2, thicknessCm: 5 }])).toBeCloseTo(Math.exp(-1));
    expect(
      transmittedFraction([
        { muCmInv: 0.2, thicknessCm: 2 },
        { muCmInv: 0.3, thicknessCm: 2 },
      ]),
    ).toBeCloseTo(Math.exp(-1));
  });
  it('creates contrast when a bone layer is added', () => {
    const state = xrayImageState(60, 12, 1);
    expect(state.bonePathTransmission).toBeLessThan(state.tissueTransmission);
    expect(state.detectorContrast).toBeGreaterThan(0);
  });
  it('models less attenuation at higher photon energy', () => {
    expect(illustrativeMu('bone', 100)).toBeLessThan(illustrativeMu('bone', 40));
  });
  it('rejects non-physical inputs', () => {
    expect(() => transmittedFraction([{ muCmInv: -1, thicknessCm: 1 }])).toThrow();
    expect(() => illustrativeMu('bone', 0)).toThrow();
  });
  it('uses one deterministic photon cohort for both material paths', () => {
    const cohort = createXrayPhotonCohort(30);
    expect(createXrayPhotonCohort(30)).toEqual(cohort);
    const exposure = xrayExposureAt(xrayImageState(60, 12, 1), cohort, 1);
    expect(exposure.tissuePhotons.map((photon) => photon.attenuationSample)).toEqual(
      exposure.bonePhotons.map((photon) => photon.attenuationSample),
    );
    expect(exposure.tissueDetected).toBeGreaterThan(exposure.boneDetected);
  });
  it('moves photons forward monotonically as exposure runs', () => {
    const state = xrayImageState(90, 8, 1);
    const cohort = createXrayPhotonCohort(24);
    const early = xrayExposureAt(state, cohort, 0.25);
    const late = xrayExposureAt(state, cohort, 0.75);
    late.tissuePhotons.forEach((photon, index) =>
      expect(photon.pathProgress).toBeGreaterThanOrEqual(early.tissuePhotons[index]!.pathProgress),
    );
  });
});
