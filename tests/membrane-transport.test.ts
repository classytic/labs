import { describe, expect, it } from 'vitest';
import { membraneTransportState } from '../src/biology/membrane-transport/core.js';
describe('membrane transport', () => {
  it('moves passive solute down its gradient', () => {
    const state = membraneTransportState({
      mode: 'diffusion',
      outside: 8,
      inside: 2,
      permeability: 0.5,
      atp: false,
    });
    expect(state.netDirection).toBe('into cell');
    expect(state.rate).toBe(3);
    expect(state.requiresAtp).toBe(false);
  });
  it('moves water toward higher solute concentration', () => {
    expect(
      membraneTransportState({ mode: 'osmosis', outside: 2, inside: 8, permeability: 1, atp: false })
        .netDirection,
    ).toBe('into cell');
  });
  it('stalls an active carrier without energy', () => {
    const state = membraneTransportState({
      mode: 'active',
      outside: 2,
      inside: 8,
      permeability: 1,
      atp: false,
    });
    expect(state.netDirection).toBe('stalled');
    expect(state.rate).toBe(0);
    expect(state.requiresAtp).toBe(true);
  });
  it('reports dynamic equilibrium', () => {
    expect(
      membraneTransportState({ mode: 'facilitated', outside: 5, inside: 5, permeability: 1, atp: false })
        .netDirection,
    ).toBe('equilibrium');
  });
});
