/**
 * A serial-in, parallel-out shift register, on the sequential engine.
 *
 * Bits arrive on one wire, one per clock edge, and each edge moves everything already stored one
 * stage further along. After four edges the four bits are all present at once, side by side, which
 * is the whole job: turning a stream into a word. Every serial link (a UART, SPI, the data line of
 * a USB cable) has one of these at the receiving end, and the 74HC595 that every microcontroller
 * kit uses to drive eight LEDs from three pins is exactly this circuit with an output latch added.
 *
 * The fact students get wrong is ORDER. The first bit sent does not end up first; it has travelled
 * furthest, so it sits at the far end. Loading a chosen pattern therefore means sending it
 * backwards, which is the challenge the lab sets.
 *
 * Stages are reported in the order data flows, entry first. The engine stores the entry stage at
 * the highest index, so this module reverses once at the boundary and nowhere else.
 */

import {
  createSequentialState,
  stepSequential,
  type SequentialLogicDoc,
  type SequentialState,
} from './sequential.js';

export const SHIFT_WIDTH = 4;

const shiftDoc = (width: number): SequentialLogicDoc => ({
  inputs: [
    { id: 'serial', label: 'Serial in', value: false },
    { id: 'clock', label: 'Clock', value: false },
  ],
  gates: [],
  cells: [{ id: 'reg', kind: 'shift-register', width, clock: 'clock', serialIn: 'serial' }],
  outputs: [],
});

/** Stages in the order data flows through them: the one that receives the new bit comes first. */
const stagesOf = (state: SequentialState, width: number): boolean[] =>
  [...(state.bits.reg ?? Array.from({ length: width }, () => false))].reverse();

export interface ShiftSnapshot {
  /** The bit fed in on this edge, or null for the empty starting state. */
  fed: boolean | null;
  stages: boolean[];
  /** The bit that fell off the far end on this edge. */
  out: boolean | null;
}

/** Feed bits one per clock edge and record the register after each edge. */
export function runShift(bits: boolean[], width = SHIFT_WIDTH): ShiftSnapshot[] {
  const doc = shiftDoc(width);
  let state = createSequentialState(doc);
  const history: ShiftSnapshot[] = [{ fed: null, stages: stagesOf(state, width), out: null }];
  for (const bit of bits) {
    const before = stagesOf(state, width);
    // One clock period: low, then the rising edge that shifts.
    state = stepSequential(doc, state, { serial: bit, clock: false }).state;
    state = stepSequential(doc, state, { serial: bit, clock: true }).state;
    history.push({ fed: bit, stages: stagesOf(state, width), out: before[width - 1] ?? false });
  }
  return history;
}

/** The order to send bits in so the register ends up holding `target`, read entry stage first. */
export const sendOrderFor = (target: boolean[]): boolean[] => [...target].reverse();

export const toBits = (pattern: string): boolean[] => pattern.split('').map((ch) => ch === '1');
export const fromBits = (bits: boolean[]): string => bits.map((bit) => (bit ? '1' : '0')).join('');
