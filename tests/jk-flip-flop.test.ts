import { describe, expect, it } from 'vitest';
import { clockWave, jkActions, jkFlipFlop, risingEdges, waveFrom } from '../src/logic/timing.js';
import { createSequentialState, stepSequential, type SequentialLogicDoc } from '../src/logic/sequential.js';

const LENGTH = 24;
const clock = clockWave(LENGTH, 8); // rising edges at 4, 12, 20
const high = waveFrom(LENGTH, [[0, LENGTH - 1]]);
const low = waveFrom(LENGTH, []);

describe('the four things a JK flip-flop does at an edge', () => {
  it('sets with J alone and resets with K alone', () => {
    expect(jkFlipFlop(clock, high, low).slice(4)).toEqual(Array(20).fill(true));
    const setThenReset = jkFlipFlop(clock, waveFrom(LENGTH, [[0, 8]]), waveFrom(LENGTH, [[10, 23]]));
    expect(setThenReset[4]).toBe(true);
    expect(setThenReset[12]).toBe(false);
  });

  it('holds when both are low, however long', () => {
    expect(jkFlipFlop(clock, low, low).every((level) => !level)).toBe(true);
  });

  it('TOGGLES when both are high, which is the SR latch’s forbidden input put to work', () => {
    const q = jkFlipFlop(clock, high, high);
    expect(q[4]).toBe(true);
    expect(q[12]).toBe(false);
    expect(q[20]).toBe(true);
  });

  it('changes only on rising edges', () => {
    const q = jkFlipFlop(clock, waveFrom(LENGTH, [[2, 14]]), waveFrom(LENGTH, [[6, 22]]));
    q.forEach((level, t) => {
      if (t > 0 && level !== q[t - 1]) expect(risingEdges(clock)).toContain(t);
    });
  });
});

describe('toggling on every edge halves the frequency', () => {
  it('produces one output cycle for every two clock cycles, which is a counter stage', () => {
    const long = clockWave(64, 8); // 8 rising edges
    const q = jkFlipFlop(long, waveFrom(64, [[0, 63]]), waveFrom(64, [[0, 63]]));
    const changes = q.filter((level, t) => t > 0 && level !== q[t - 1]).length;
    expect(risingEdges(long)).toHaveLength(8);
    // The first edge takes Q from its initial 0 to 1, and every later edge flips it again.
    expect(changes).toBe(8);
  });
});

describe('naming what happened at each edge', () => {
  it('reads the characteristic table off the levels at the edge', () => {
    const j = waveFrom(LENGTH, [
      [4, 4],
      [20, 20],
    ]);
    const k = waveFrom(LENGTH, [
      [12, 12],
      [20, 20],
    ]);
    expect(jkActions(clock, j, k)).toEqual([
      { t: 4, action: 'set' },
      { t: 12, action: 'reset' },
      { t: 20, action: 'toggle' },
    ]);
  });
});

describe('the engine cells', () => {
  it('makes a T flip-flop toggle only while T is high', () => {
    const doc: SequentialLogicDoc = {
      inputs: [
        { id: 't', value: false },
        { id: 'c', value: false },
      ],
      gates: [],
      cells: [{ id: 'q', kind: 't-flip-flop', t: 't', clock: 'c' }],
      outputs: [],
    };
    let state = createSequentialState(doc);
    const pulse = (t: boolean) => {
      state = stepSequential(doc, state, { t, c: false }).state;
      state = stepSequential(doc, state, { t, c: true }).state;
      return state.bits.q?.[0];
    };
    expect(pulse(true)).toBe(true);
    expect(pulse(false)).toBe(true);
    expect(pulse(true)).toBe(false);
  });

  it('resets a JK flip-flop synchronously like any other clocked cell', () => {
    const doc: SequentialLogicDoc = {
      inputs: [
        { id: 'j', value: true },
        { id: 'k', value: false },
        { id: 'r', value: false },
        { id: 'c', value: false },
      ],
      gates: [],
      cells: [{ id: 'q', kind: 'jk-flip-flop', j: 'j', k: 'k', clock: 'c', reset: 'r' }],
      outputs: [],
    };
    let state = stepSequential(doc, createSequentialState(doc), {
      j: true,
      k: false,
      r: false,
      c: true,
    }).state;
    expect(state.bits.q).toEqual([true]);
    state = stepSequential(doc, state, { j: true, k: false, r: true, c: false }).state;
    state = stepSequential(doc, state, { j: true, k: false, r: true, c: true }).state;
    expect(state.bits.q).toEqual([false]);
  });
});
