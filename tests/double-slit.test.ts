import { describe, expect, it } from 'vitest';
import {
  fringeSpacingMm,
  sampleSlitDetections,
  slitIntensity,
  type SlitSetup,
} from '../src/physics/modern/quantum/double-slit-core.js';
const setup: SlitSetup = {
  wavelengthNm: 500,
  slitSeparationUm: 100,
  slitWidthUm: 25,
  screenDistanceM: 1,
  whichPath: false,
};
describe('double slit engine', () => {
  it('has a central maximum', () => expect(slitIntensity(0, setup)).toBeCloseTo(1));
  it('predicts lambda L over d spacing', () => expect(fringeSpacingMm(setup)).toBeCloseTo(5));
  it('removes interference when paths are marked', () =>
    expect(slitIntensity(2.5, { ...setup, whichPath: true })).toBeGreaterThan(slitIntensity(2.5, setup)));
  it('samples repeatably within screen bounds', () => {
    const a = sampleSlitDetections(20, setup);
    expect(a).toEqual(sampleSlitDetections(20, setup));
    expect(a.every((v) => Math.abs(v.positionMm) <= 40)).toBe(true);
  });
});
