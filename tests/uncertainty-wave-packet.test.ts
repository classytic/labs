import { describe, expect, it } from 'vitest';
import {
  gaussianProbability,
  minimumUncertaintyPacket,
} from '../src/physics/modern/quantum/uncertainty-core.js';
describe('minimum uncertainty packet', () => {
  it('saturates the uncertainty bound', () => {
    for (const width of [0.25, 1, 3]) expect(minimumUncertaintyPacket(width).product).toBeCloseTo(0.5);
  });
  it('broadens momentum when position narrows', () => {
    expect(minimumUncertaintyPacket(0.5).sigmaP).toBeGreaterThan(minimumUncertaintyPacket(2).sigmaP);
  });
  it('produces a centred Gaussian profile', () => {
    expect(gaussianProbability(0, 1)).toBe(1);
    expect(gaussianProbability(2, 1)).toBeLessThan(gaussianProbability(1, 1));
  });
  it('rejects non-physical spreads', () => {
    expect(() => minimumUncertaintyPacket(0)).toThrow();
    expect(() => gaussianProbability(0, -1)).toThrow();
  });
});
