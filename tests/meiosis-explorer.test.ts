import { describe, expect, it } from 'vitest';
import { MEIOSIS_CHECKPOINTS, meiosisProducts, meiosisState } from '../src/biology/cell-division/index.js';
describe('meiosis explorer', () => {
  it('keeps sisters joined during homolog separation', () => {
    const state = meiosisState('anaphase-i');
    expect(state.ploidy).toBe('haploid');
    expect(state.cellCount).toBe(2);
    expect(state.sistersAttached).toBe(true);
  });
  it('separates sisters into four products', () => {
    const state = meiosisState('products');
    expect(state.cellCount).toBe(4);
    expect(state.sistersAttached).toBe(false);
    expect(MEIOSIS_CHECKPOINTS).toHaveLength(6);
  });
  it('models recombinant products only after crossing over', () => {
    expect(new Set(meiosisProducts(true, 'maternal-left')).size).toBe(4);
    expect(new Set(meiosisProducts(false, 'maternal-left')).size).toBe(2);
  });
});
