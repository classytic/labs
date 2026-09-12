import { describe, expect, it } from 'vitest';
import { evaluate, type LogicDoc } from '../src/logic/index.js';

/**
 * The moment a digital logic course turns: wire two NAND gates into each other and the
 * circuit stops being a function of its inputs. These lock the behaviour a learner must be
 * able to discover by BUILDING it, rather than being handed a latch as a primitive.
 */

/** Active-low SR latch: two cross-coupled NANDs, exactly what a student wires on paper. */
const nandLatch = (setBar: boolean, resetBar: boolean): LogicDoc => ({
  inputs: [
    { id: 'nS', label: 'S', value: setBar },
    { id: 'nR', label: 'R', value: resetBar },
  ],
  gates: [
    { id: 'q', kind: 'NAND', in: ['nS', 'qBar'] },
    { id: 'qBar', kind: 'NAND', in: ['nR', 'q'] },
  ],
  outputs: [{ id: 'Q', in: 'q', label: 'Q' }],
});

describe('cross-coupled NAND latch', () => {
  it('settles instead of being rejected as a cycle', () => {
    const solution = evaluate(nandLatch(true, true));
    expect(solution.stable).toBe(true);
    expect(solution.diagnostics).toEqual([]);
    expect(solution.valid).toBe(true);
  });

  it('sets when S is pulled low, and Q and Q-bar stay opposite', () => {
    const solution = evaluate(nandLatch(false, true));
    expect(solution.outputs.Q).toBe(true);
    expect(solution.value('qBar')).toBe(false);
  });

  it('resets when R is pulled low', () => {
    const solution = evaluate(nandLatch(true, false));
    expect(solution.outputs.Q).toBe(false);
    expect(solution.value('qBar')).toBe(true);
  });

  it('REMEMBERS a 1 after both inputs go inactive', () => {
    const set = evaluate(nandLatch(false, true));
    expect(set.outputs.Q).toBe(true);
    const held = evaluate(nandLatch(true, true), { seed: set.settled });
    expect(held.outputs.Q).toBe(true);
    expect(held.stable).toBe(true);
  });

  it('REMEMBERS a 0 after both inputs go inactive', () => {
    const reset = evaluate(nandLatch(true, false));
    expect(reset.outputs.Q).toBe(false);
    const held = evaluate(nandLatch(true, true), { seed: reset.settled });
    expect(held.outputs.Q).toBe(false);
    expect(held.stable).toBe(true);
  });

  it('holds indefinitely, not just for one evaluation', () => {
    let solution = evaluate(nandLatch(false, true));
    for (let tick = 0; tick < 25; tick++) {
      solution = evaluate(nandLatch(true, true), { seed: solution.settled });
    }
    expect(solution.outputs.Q).toBe(true);
  });

  it('is the same circuit either way: identical doc, opposite memory', () => {
    // The proof that state, not structure, decides the output.
    const remembersHigh = evaluate(nandLatch(true, true), { seed: { q: true, qBar: false } });
    const remembersLow = evaluate(nandLatch(true, true), { seed: { q: false, qBar: true } });
    expect(remembersHigh.outputs.Q).toBe(true);
    expect(remembersLow.outputs.Q).toBe(false);
  });

  it('reports the forbidden input combination as producing both outputs high', () => {
    // Both inputs low forces Q and Q-bar high together, which is why the datasheet forbids it.
    const solution = evaluate(nandLatch(false, false));
    expect(solution.value('q')).toBe(true);
    expect(solution.value('qBar')).toBe(true);
  });
});

describe('feedback that does not settle', () => {
  it('flags a three-inverter ring oscillator', () => {
    const ring: LogicDoc = {
      inputs: [],
      gates: [
        { id: 'g1', kind: 'NOT', in: ['g3'] },
        { id: 'g2', kind: 'NOT', in: ['g1'] },
        { id: 'g3', kind: 'NOT', in: ['g2'] },
      ],
      outputs: [{ id: 'o', in: 'g1' }],
    };
    const solution = evaluate(ring);
    expect(solution.stable).toBe(false);
    expect(solution.valid).toBe(false);
    expect(solution.diagnostics[0]?.code).toBe('combinational-cycle');
  });

  it('treats a two-inverter ring as bistable, because it is', () => {
    const pair: LogicDoc = {
      inputs: [],
      gates: [
        { id: 'a', kind: 'NOT', in: ['b'] },
        { id: 'b', kind: 'NOT', in: ['a'] },
      ],
      outputs: [{ id: 'o', in: 'a' }],
    };
    expect(evaluate(pair).stable).toBe(true);
    expect(evaluate(pair, { seed: { a: false, b: true } }).value('a')).toBe(false);
    expect(evaluate(pair, { seed: { a: true, b: false } }).value('a')).toBe(true);
  });
});

describe('combinational networks are unaffected', () => {
  const halfAdder: LogicDoc = {
    inputs: [
      { id: 'a', value: true },
      { id: 'b', value: true },
    ],
    gates: [
      { id: 'sum', kind: 'XOR', in: ['a', 'b'] },
      { id: 'carry', kind: 'AND', in: ['a', 'b'] },
    ],
    outputs: [
      { id: 'S', in: 'sum' },
      { id: 'C', in: 'carry' },
    ],
  };

  it('produces the same values a single pass would', () => {
    const solution = evaluate(halfAdder);
    expect(solution.outputs).toEqual({ S: false, C: true });
    expect(solution.stable).toBe(true);
  });

  it('keeps propagation levels, which drive the step-by-step reveal', () => {
    const solution = evaluate(halfAdder);
    expect(solution.levels[0]).toEqual(['a', 'b']);
    expect(solution.depthOf('sum')).toBe(1);
  });

  it('ignores a seed, because nothing in it holds state', () => {
    const seeded = evaluate(halfAdder, { seed: { sum: true, carry: false } });
    expect(seeded.outputs).toEqual({ S: false, C: true });
  });
});
