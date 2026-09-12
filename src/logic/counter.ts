/**
 * A binary counter, and the one AND gate that turns it into a counter of any length.
 *
 * Two ideas carry a counter lesson, and both are pictures rather than definitions.
 *
 * The first is that counting in binary and dividing a frequency are the same circuit. Drawn as
 * waveforms, the ones bit flips on every clock edge, the twos bit on every second edge, the fours
 * bit on every fourth. With the ones bit drawn nearest the clock, read any column from the bottom
 * up and it is the count in binary; read any row left to right and it is the clock divided by a
 * power of two. That is how a quartz watch gets one tick a
 * second out of a crystal vibrating 32,768 times a second: 32,768 is 2 to the 15, so fifteen
 * stages divide it down.
 *
 * The second is how to stop at a number that is not a power of two. A decade counter is an
 * ordinary 4-bit counter plus a gate that notices the last count and resets it on the next edge.
 * That gate only needs to read the bits that are 1 in the last count, because no smaller number
 * can have all of those bits set. That is the moment students realise the design is small.
 *
 * Everything runs through the sequential engine as a real `counter` cell with a real AND gate on
 * its synchronous reset, so the reset timing here is the engine's, not a second opinion.
 */

import { sequenceTable, type SequentialLogicDoc } from './sequential.js';

export const MAX_WIDTH = 4;

/** Bit positions that are 1 in `modulus - 1`: the only inputs the terminal-count gate needs. */
export function detectBits(modulus: number): number[] {
  const last = modulus - 1;
  const bits: number[] = [];
  for (let bit = 0; 2 ** bit <= last; bit++) if (Math.floor(last / 2 ** bit) % 2 === 1) bits.push(bit);
  return bits;
}

/** A width-bit up counter that wraps after `modulus - 1`. Full-length counters need no gate. */
export function modCounterDoc(modulus: number, width = MAX_WIDTH): SequentialLogicDoc {
  const full = modulus >= 2 ** width;
  const bits = detectBits(modulus);
  return {
    inputs: [{ id: 'clock', label: 'Clock', value: false }],
    gates: full
      ? []
      : [
          {
            id: 'tc',
            // One detected bit is a plain wire; the engine's buffer keeps the netlist uniform.
            kind: bits.length > 1 ? 'AND' : 'buffer',
            in: bits.map((bit) => `count[${bit}]`),
            label: 'last count',
          },
        ],
    cells: [
      {
        id: 'count',
        kind: 'counter',
        width,
        clock: 'clock',
        ...(full ? {} : { reset: 'tc', resetMode: 'synchronous' as const }),
      },
    ],
    outputs: Array.from({ length: width }, (_, bit) => ({
      id: `q${bit}`,
      in: `count[${bit}]`,
      label: `Q${bit}`,
    })),
  };
}

export interface CounterRun {
  /** Slot-level clock: low then high for every clock period. */
  clock: boolean[];
  /** `bits[b][t]` is Qb at slot t. */
  bits: boolean[][];
  /** The count held during each clock period, before that period's rising edge is applied. */
  counts: number[];
}

/** Run `periods` clock periods through the engine, two slots per period (low, then high). */
export function runCounter(modulus: number, periods: number, width = MAX_WIDTH): CounterRun {
  const doc = modCounterDoc(modulus, width);
  const clock = Array.from({ length: periods * 2 }, (_, t) => t % 2 === 1);
  const trace = sequenceTable(
    doc,
    clock.map((level) => ({ clock: level })),
  );
  const bits = Array.from({ length: width }, (_, bit) =>
    trace.map((entry) => entry.state.bits.count?.[bit] ?? false),
  );
  // The value during a period's LOW half is what the period started with.
  const counts = Array.from({ length: periods }, (_, period) =>
    bits.reduce((sum, wave, bit) => sum + (wave[period * 2] ? 2 ** bit : 0), 0),
  );
  return { clock, bits, counts };
}

/** How many times a wave changes level. Each stage should change half as often as the one before. */
export const transitions = (wave: boolean[]): number =>
  wave.filter((level, t) => t > 0 && level !== wave[t - 1]).length;

/** Divide-by-two stages needed to bring `ratio` down to one, when `ratio` is a power of two. */
export function stagesFor(ratio: number): number | undefined {
  const stages = Math.log2(ratio);
  return Number.isInteger(stages) ? stages : undefined;
}

/** A readable name for the terminal-count condition, e.g. "Q3 and Q0". */
export const detectLabel = (modulus: number): string =>
  detectBits(modulus)
    .slice()
    .reverse()
    .map((bit) => `Q${bit}`)
    .join(' and ');

export const toBinary = (value: number, width = MAX_WIDTH): string => value.toString(2).padStart(width, '0');
