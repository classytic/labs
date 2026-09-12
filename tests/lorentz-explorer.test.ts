import { describe, expect, it } from 'vitest';
import { intervalKind, lorentzExplorerState } from '../src/physics/modern/relativity/explorer-core.js';
describe('Lorentz explorer', () => {
  it('classifies intervals', () => {
    expect(intervalKind(4)).toBe('timelike');
    expect(intervalKind(0)).toBe('lightlike');
    expect(intervalKind(-4)).toBe('spacelike');
  });
  it('preserves the interval', () => {
    const s = lorentzExplorerState({ x: 2.4, ct: 3.7 }, 0.83);
    expect(s.transformedInterval).toBeCloseTo(s.interval, 10);
  });
  it('preserves lightlike events', () =>
    expect(lorentzExplorerState({ x: 3, ct: 3 }, -0.6).kind).toBe('lightlike'));
});
