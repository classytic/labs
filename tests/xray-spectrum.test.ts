import { describe, expect, it } from 'vitest';
import {
  aluminiumFilterTransmission,
  createSpectrumPhotonCohort,
  xraySpectrum,
  xraySpectrumExposureAt,
} from '../src/physics/modern/imaging/xray-spectrum-core.js';
describe('X-ray tube spectrum engine', () => {
  it('uses tube voltage as the endpoint energy', () => {
    expect(xraySpectrum(80, 2, 'tungsten').endpointKev).toBe(80);
  });
  it('filters low energies more strongly', () => {
    expect(aluminiumFilterTransmission(20, 2)).toBeLessThan(aluminiumFilterTransmission(80, 2));
  });
  it('hardens while reducing the modeled beam', () => {
    const open = xraySpectrum(90, 0, 'tungsten'),
      filtered = xraySpectrum(90, 4, 'tungsten');
    expect(filtered.meanEnergyKev).toBeGreaterThan(open.meanEnergyKev);
    expect(filtered.relativeOutput).toBeLessThan(open.relativeOutput);
  });
  it('shows target lines only above the excitation threshold', () => {
    expect(xraySpectrum(60, 0, 'tungsten').bins.every((bin) => bin.characteristic === 0)).toBe(true);
    expect(xraySpectrum(100, 0, 'tungsten').bins.some((bin) => bin.characteristic > 0)).toBe(true);
  });
  it('samples one deterministic emitted cohort and filters low energies preferentially', () => {
    const state = xraySpectrum(90, 3, 'tungsten');
    const photons = createSpectrumPhotonCohort(state, 3, 80);
    expect(createSpectrumPhotonCohort(state, 3, 80)).toEqual(photons);
    const removed = photons.filter((photon) => !photon.transmitted);
    const passed = photons.filter((photon) => photon.transmitted);
    const mean = (items: typeof photons) =>
      items.reduce((sum, photon) => sum + photon.energyKev, 0) / items.length;
    expect(mean(passed)).toBeGreaterThan(mean(removed));
  });
  it('accumulates detector counts monotonically', () => {
    const state = xraySpectrum(100, 2, 'tungsten');
    const photons = createSpectrumPhotonCohort(state, 2, 48);
    const early = xraySpectrumExposureAt(photons, 0.25);
    const late = xraySpectrumExposureAt(photons, 0.75);
    expect(late.emitted).toBeGreaterThan(early.emitted);
    expect(late.detected).toBeGreaterThanOrEqual(early.detected);
    expect(late.filteredOut).toBeGreaterThanOrEqual(early.filteredOut);
  });
});
