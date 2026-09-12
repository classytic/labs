import { describe, expect, it } from 'vitest';
import { cellEnergyState } from '../src/biology/cell-energy/core.js';
describe('cell energy', () => {
  it('identifies the limiting aerobic input', () => {
    expect(cellEnergyState({ glucose: 3, oxygen: 8, demand: 2, fermentation: false }).limiting).toBe(
      'glucose',
    );
    expect(cellEnergyState({ glucose: 8, oxygen: 3, demand: 2, fermentation: false }).limiting).toBe(
      'oxygen',
    );
  });
  it('shows the aerobic yield advantage', () => {
    const aerobic = cellEnergyState({ glucose: 5, oxygen: 5, demand: 1, fermentation: true }),
      anaerobic = cellEnergyState({ glucose: 5, oxygen: 0, demand: 1, fermentation: true });
    expect(aerobic.atpProduction).toBe(150);
    expect(anaerobic.atpProduction).toBe(10);
  });
  it('caps supplied work at one hundred percent', () => {
    expect(cellEnergyState({ glucose: 10, oxygen: 10, demand: 1, fermentation: false }).workFraction).toBe(1);
  });
  it('reports an energy deficit', () => {
    const state = cellEnergyState({ glucose: 1, oxygen: 1, demand: 5, fermentation: false });
    expect(state.balance).toBeLessThan(0);
    expect(state.workFraction).toBeCloseTo(0.2);
  });
});
