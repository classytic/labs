import { describe, expect, it } from 'vitest';
import { measurementState, type MeasurementInput } from '../src/math/measurement/core.js';

const base: MeasurementInput = {
  mode: 'pi-roll',
  radius: 2,
  height: 5,
  turns: 1,
  length: 12,
  width: 8,
  pathWidth: 1,
  gridSize: 1,
  coveredCells: 24,
  partialCells: 10,
};

describe('measurement engine', () => {
  it('discovers the same pi ratio at every authored radius', () => {
    for (const radius of [0.5, 2, 5])
      expect(measurementState({ ...base, radius }).secondaryValue).toBeCloseTo(Math.PI);
  });

  it('maps fractional and complete wheel turns to travelled circumference and rotation', () => {
    const state = measurementState({ ...base, mode: 'wheel-distance', turns: 2.5 });
    expect(state.primaryValue).toBeCloseTo(10 * Math.PI);
    expect(state.secondaryValue).toBe(900);
  });

  it('computes cylinder volume and the complete two-circle net', () => {
    const state = measurementState({ ...base, mode: 'cylinder' });
    expect(state.primaryValue).toBeCloseTo(20 * Math.PI);
    expect(state.secondaryValue).toBeCloseTo(28 * Math.PI);
  });

  it('decomposes a walking path as outer area minus the pond', () => {
    const state = measurementState({ ...base, mode: 'walking-path' });
    expect(state.primaryValue).toBe(44);
    expect(state.secondaryValue).toBe(48);
  });

  it('scales full and half boundary cells by authored cell area', () => {
    expect(measurementState({ ...base, mode: 'irregular-area', gridSize: 2 }).primaryValue).toBe(116);
  });
});
