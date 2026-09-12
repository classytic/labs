import { describe, expect, it } from 'vitest';
import {
  applyQuantumGate,
  initialGateState,
  runGateSequence,
} from '../src/physics/modern/quantum/gates-core.js';
describe('single-qubit gate engine', () => {
  it('X maps zero to one', () => expect(applyQuantumGate(initialGateState(), 'x').bloch.z).toBeCloseTo(-1));
  it('H creates plus and is self inverse', () => {
    expect(applyQuantumGate(initialGateState(), 'h').bloch.x).toBeCloseTo(1);
    expect(runGateSequence(['h', 'h']).bloch.z).toBeCloseTo(1);
  });
  it('S changes phase but preserves probabilities', () => {
    const plus = runGateSequence(['h']),
      shifted = applyQuantumGate(plus, 's');
    expect(shifted.bloch.y).toBeCloseTo(1);
    expect(
      shifted.alpha.re ** 2 + shifted.alpha.im ** 2 + shifted.beta.re ** 2 + shifted.beta.im ** 2,
    ).toBeCloseTo(1);
  });
  it('HZH equals X on zero', () => expect(runGateSequence(['h', 'z', 'h']).bloch.z).toBeCloseTo(-1));
});
