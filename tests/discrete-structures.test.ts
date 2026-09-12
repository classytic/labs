import { describe, expect, it } from 'vitest';
import { congruent, mod, residuePath } from '../src/discrete/modular-clock/core.js';
import { applyInvariantMove, targetReachableByInvariant } from '../src/discrete/invariant/core.js';
import { recurrenceDependencies, recurrenceTerms } from '../src/discrete/recurrence/core.js';

describe('discrete structure engines', () => {
  it('normalizes negative residues and walks a modular cycle', () => {
    expect(mod(-1, 12)).toBe(11);
    expect(congruent(-1, 23, 12)).toBe(true);
    expect(residuePath(2, 5, 3, 12)).toEqual([2, 7, 0, 5]);
  });

  it('tracks legal moves separately from the invariant proof', () => {
    const move = { id: 'pair', label: 'add two', delta: 2 };
    expect(applyInvariantMove({ value: 5, moves: [] }, move)).toEqual({ value: 7, moves: ['pair'] });
    expect(targetReachableByInvariant(5, 12, [move], 2)).toBe(false);
    expect(targetReachableByInvariant(5, 13, [move], 2)).toBe(true);
  });

  it('constructs a recurrence from base cases and dependency order', () => {
    expect(recurrenceTerms({ base: [1, 1], coefficients: [1, 1] }, 7)).toEqual([1, 1, 2, 3, 5, 8, 13]);
    expect(recurrenceDependencies(5, 2)).toEqual([3, 4]);
  });
});
