import { describe, expect, it } from 'vitest';
import { overlapStrength } from '../src/chem/orbital-overlap/core.js';
describe('orbital overlap', () => {
  it('distinguishes constructive and destructive phase', () => {
    expect(overlapStrength('p-p-sigma', 1, 'bonding')).toBeGreaterThan(0);
    expect(overlapStrength('p-p-sigma', 1, 'antibonding')).toBeLessThan(0);
  });
  it('decays with nuclear separation', () => {
    expect(Math.abs(overlapStrength('s-s-sigma', 0.5, 'bonding'))).toBeGreaterThan(
      Math.abs(overlapStrength('s-s-sigma', 3, 'bonding')),
    );
  });
});
