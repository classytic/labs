/**
 * Timing diagrams: one D waveform, one clock, and the two circuits that read them differently.
 *
 * "Draw Q for a D latch and for a positive-edge-triggered D flip-flop" is the most reliable exam
 * question in a first digital logic course, and it is reliably answered wrong, because the two
 * circuits share a letter and a symbol and differ only in WHEN they look at D. A latch looks the
 * whole time the clock is high. A flip-flop looks for one instant, at the rising edge.
 *
 * So everything here is built to make that difference land on specific slots. Both circuits run
 * through the same sequential engine, so there is one definition of time rather than two that
 * might drift apart, and `disagreement` reports exactly the slots where their Q differs. Those
 * slots are the exam answer, and the lab shades them.
 *
 * `setupViolations` is the honest footnote. The engine samples D at the edge slot itself, which
 * is a modelling choice. When D changes at that very instant, real hardware is not guaranteed to
 * capture either value, so those edges are reported rather than silently resolved.
 */

import { sequenceTable, type SequentialLogicDoc } from './sequential.js';

export type Wave = boolean[];

/** A clock that is low for `period / 2` slots, then high for `period / 2`, starting low. */
export function clockWave(length: number, period = 4): Wave {
  const half = Math.max(1, Math.floor(period / 2));
  return Array.from({ length }, (_, t) => Math.floor(t / half) % 2 === 1);
}

export const risingEdges = (clock: Wave): number[] =>
  clock.flatMap((level, t) => (level && !(clock[t - 1] ?? false) ? [t] : []));

const LATCH_DOC: SequentialLogicDoc = {
  inputs: [
    { id: 'd', label: 'D', value: false },
    { id: 'clock', label: 'Clock', value: false },
  ],
  gates: [],
  cells: [{ id: 'q', kind: 'd-latch', d: 'd', enable: 'clock' }],
  outputs: [],
};

const FLIP_FLOP_DOC: SequentialLogicDoc = {
  inputs: [
    { id: 'd', label: 'D', value: false },
    { id: 'clock', label: 'Clock', value: false },
  ],
  gates: [],
  cells: [{ id: 'q', kind: 'd-flip-flop', d: 'd', clock: 'clock' }],
  outputs: [],
};

function run(doc: SequentialLogicDoc, clock: Wave, d: Wave): Wave {
  const vectors = clock.map((level, t) => ({ clock: level, d: d[t] ?? false }));
  return sequenceTable(doc, vectors).map((entry) => entry.state.bits.q?.[0] ?? false);
}

/** Transparent while the clock is high: Q follows D, including any glitch inside that window. */
export const dLatch = (clock: Wave, d: Wave): Wave => run(LATCH_DOC, clock, d);

/** Samples D at each rising edge and holds it until the next one, whatever D does in between. */
export const dFlipFlop = (clock: Wave, d: Wave): Wave => run(FLIP_FLOP_DOC, clock, d);

const JK_DOC: SequentialLogicDoc = {
  inputs: [
    { id: 'j', label: 'J', value: false },
    { id: 'k', label: 'K', value: false },
    { id: 'clock', label: 'Clock', value: false },
  ],
  gates: [],
  cells: [{ id: 'q', kind: 'jk-flip-flop', j: 'j', k: 'k', clock: 'clock' }],
  outputs: [],
};

/** A positive-edge JK flip-flop on the engine. With K tied to J it is a T flip-flop. */
export function jkFlipFlop(clock: Wave, j: Wave, k: Wave): Wave {
  const vectors = clock.map((level, t) => ({ clock: level, j: j[t] ?? false, k: k[t] ?? false }));
  return sequenceTable(JK_DOC, vectors).map((entry) => entry.state.bits.q?.[0] ?? false);
}

export type JkAction = 'hold' | 'set' | 'reset' | 'toggle';

/** What the flip-flop did at each rising edge, read from the levels there: the characteristic table. */
export const jkActions = (clock: Wave, j: Wave, k: Wave): { t: number; action: JkAction }[] =>
  risingEdges(clock).map((t) => {
    const jj = j[t] ?? false;
    const kk = k[t] ?? false;
    return { t, action: jj && kk ? 'toggle' : jj ? 'set' : kk ? 'reset' : 'hold' };
  });

/** Slots where the two circuits' Q differ. These are the exam answer. */
export const disagreement = (latch: Wave, flipFlop: Wave): number[] =>
  latch.flatMap((level, t) => (level !== flipFlop[t] ? [t] : []));

/** Rising edges at which D changed at the same instant, so real hardware could capture either. */
export const setupViolations = (clock: Wave, d: Wave): number[] =>
  risingEdges(clock).filter((t) => t > 0 && d[t] !== d[t - 1]);

/** A wave that is high over each inclusive `[from, to]` range and low elsewhere. */
export const waveFrom = (length: number, ranges: [number, number][]): Wave =>
  Array.from({ length }, (_, t) => ranges.some(([from, to]) => t >= from && t <= to));

/**
 * The default waveform is chosen, not random. With a period-8 clock the rising edges fall at 4, 12
 * and 20, and each high stretch of D is placed to carry exactly one idea:
 *
 * - 2 to 9: D rises BEFORE the edge at 4 and is still high at it, so both circuits capture a 1 and
 *   agree. It falls at 10 while the clock is low, which neither circuit notices.
 * - 13 to 14: a pulse entirely inside the high window 12 to 15, touching no edge. The latch is
 *   transparent and passes it straight through; the flip-flop never looks. This is the one that
 *   separates students who understand edge triggering from those who memorised the symbol.
 * - 18 to 21: captured by both at the edge at 20, then D falls at 22 while the clock is still
 *   high. The latch follows it back down; the flip-flop holds its 1.
 */
export const DEFAULT_LENGTH = 24;
export const DEFAULT_PERIOD = 8;
export const DEFAULT_D: Wave = waveFrom(DEFAULT_LENGTH, [
  [2, 9],
  [13, 14],
  [18, 21],
]);
