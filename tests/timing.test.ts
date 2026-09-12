import { describe, expect, it } from 'vitest';
import {
  DEFAULT_D,
  DEFAULT_LENGTH,
  DEFAULT_PERIOD,
  clockWave,
  dFlipFlop,
  dLatch,
  disagreement,
  risingEdges,
  setupViolations,
  waveFrom,
} from '../src/logic/timing.js';
import { createSequentialState, stepSequential, type SequentialLogicDoc } from '../src/logic/sequential.js';

const clock = clockWave(DEFAULT_LENGTH, DEFAULT_PERIOD);
const latch = dLatch(clock, DEFAULT_D);
const flipFlop = dFlipFlop(clock, DEFAULT_D);
const changes = (wave: boolean[]): number[] =>
  wave.flatMap((level, t) => (t > 0 && level !== wave[t - 1] ? [t] : []));

describe('the clock', () => {
  it('starts low and rises every period', () => {
    expect(clock.slice(0, 8)).toEqual([false, false, false, false, true, true, true, true]);
    expect(risingEdges(clock)).toEqual([4, 12, 20]);
  });
});

describe('the flip-flop looks for one instant', () => {
  it('changes ONLY at a rising edge, whatever D does in between', () => {
    for (const t of changes(flipFlop)) expect(risingEdges(clock)).toContain(t);
  });

  it('never sees a pulse that starts and ends between two edges', () => {
    // D is high at 13 and 14, entirely inside the high window 12..15, and the edge at 12 saw a 0.
    expect(flipFlop.slice(12, 20).every((level) => !level)).toBe(true);
  });

  it('holds what it captured even after D falls while the clock is still high', () => {
    expect(flipFlop.slice(20)).toEqual([true, true, true, true]);
  });
});

describe('the latch looks the whole time the clock is high', () => {
  it('changes only while the clock is high', () => {
    for (const t of changes(latch)) expect(clock[t]).toBe(true);
  });

  it('passes the mid-window pulse straight through', () => {
    expect(latch.slice(12, 16)).toEqual([false, true, true, false]);
  });

  it('follows D back down inside the last window', () => {
    expect(latch.slice(20)).toEqual([true, true, false, false]);
  });

  it('holds while the clock is low, even when D changes', () => {
    // D falls at 10, inside the low window 8..11; the latch closed at 7 holding a 1.
    expect(latch.slice(8, 12)).toEqual([true, true, true, true]);
  });
});

describe('the exam answer', () => {
  it('disagrees on exactly the pulse and the late fall', () => {
    expect(disagreement(latch, flipFlop)).toEqual([13, 14, 22, 23]);
  });

  it('agrees everywhere else, including the first capture', () => {
    expect(latch.slice(0, 12)).toEqual(flipFlop.slice(0, 12));
  });
});

describe('setup time is reported, not hidden', () => {
  it('finds no violations in the default waveform, which never moves D at an edge', () => {
    expect(setupViolations(clock, DEFAULT_D)).toEqual([]);
  });

  it('flags an edge where D changes at the same instant', () => {
    const risky = waveFrom(DEFAULT_LENGTH, [[12, 15]]); // rises exactly on the edge at 12
    expect(setupViolations(clock, risky)).toEqual([12]);
  });
});

describe('the engine d-latch cell', () => {
  const doc: SequentialLogicDoc = {
    inputs: [
      { id: 'd', value: false },
      { id: 'en', value: false },
    ],
    gates: [],
    cells: [{ id: 'q', kind: 'd-latch', d: 'd', enable: 'en' }],
    outputs: [{ id: 'out', in: 'q' }],
  };

  it('is transparent while enabled and holds while not', () => {
    let state = createSequentialState(doc);
    state = stepSequential(doc, state, { d: true, en: true }).state;
    expect(state.bits.q).toEqual([true]);
    state = stepSequential(doc, state, { d: false, en: false }).state;
    expect(state.bits.q).toEqual([true]);
    state = stepSequential(doc, state, { d: false, en: true }).state;
    expect(state.bits.q).toEqual([false]);
  });

  it('does not register itself as a clock, since it has none', () => {
    const state = stepSequential(doc, createSequentialState(doc), { d: true, en: true }).state;
    expect(Object.keys(state.clocks)).not.toContain('undefined');
  });
});
