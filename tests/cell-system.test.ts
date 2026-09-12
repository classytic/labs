import { describe, expect, it } from 'vitest';
import { CELL_JOURNEY, cellSystemState } from '../src/biology/cell-system/core.js';
describe('cell system', () => {
  it('keeps the secretory pathway ordered', () => {
    expect(CELL_JOURNEY).toEqual(['nucleus', 'ribosome', 'rough-er', 'golgi', 'vesicle', 'membrane']);
  });
  it('blocks the failed compartment and everything downstream', () => {
    expect(cellSystemState('ribosome', 'golgi').blocked).toBe(false);
    expect(cellSystemState('golgi', 'golgi').blocked).toBe(true);
    expect(cellSystemState('membrane', 'golgi').blocked).toBe(true);
  });
  it('keeps a healthy route available', () => {
    expect(cellSystemState('membrane').blocked).toBe(false);
  });
  it('tracks cargo identity across compartments', () => {
    expect(cellSystemState('nucleus').cargo).toBe('gene');
    expect(cellSystemState('golgi').cargo).toBe('folding protein');
    expect(cellSystemState('membrane').cargo).toBe('secretory vesicle');
  });
});
