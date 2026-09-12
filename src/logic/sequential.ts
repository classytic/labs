/**
 * Deterministic, serializable sequential-logic simulation.
 *
 * Time advances only through `stepSequential`. Stored values are read first, the
 * combinational network settles, and then active clock edges commit the next state.
 * This two-phase rule makes registers, counters, shift registers and state machines
 * independent of array order and safe to animate one tick at a time.
 */

import { evaluate } from './evaluate.js';
import type { LogicDiagnostic, LogicGate, LogicInput, LogicOutput } from './contract.js';

export type ClockEdge = 'rising' | 'falling';

interface ClockedCell {
  id: string;
  clock: string;
  edge?: ClockEdge;
  reset?: string;
  /** Reset is synchronous by default; asynchronous reset commits without a clock edge. */
  resetMode?: 'synchronous' | 'asynchronous';
  /** Clock enable: an active edge only commits while this signal is high. Every clocked
   *  cell honours it except the state machine, which advances on each edge by design. */
  enable?: string;
}

export interface SrLatchCell {
  id: string;
  kind: 'sr-latch';
  set: string;
  reset: string;
  /** NAND latches use active-low inputs; NOR latches use active-high inputs. */
  activeLow?: boolean;
  initial?: boolean;
}

/**
 * A level-sensitive D latch: transparent while `enable` is high (Q follows D, glitches and all),
 * holding while it is low. It has no clock edge, which is exactly what separates it from the
 * flip-flop below, and why the two give different answers for the same waveforms.
 */
export interface DLatchCell {
  id: string;
  kind: 'd-latch';
  d: string;
  enable: string;
  initial?: boolean;
}

export interface DFlipFlopCell extends ClockedCell {
  kind: 'd-flip-flop';
  d: string;
  initial?: boolean;
  resetValue?: boolean;
}

/**
 * JK flip-flop: the SR latch's forbidden input put to work. J sets, K resets, both low holds, and
 * BOTH HIGH TOGGLES, which is the one combination an SR latch could not be trusted with.
 */
export interface JkFlipFlopCell extends ClockedCell {
  kind: 'jk-flip-flop';
  j: string;
  k: string;
  initial?: boolean;
}

/** T flip-flop: a JK with J and K tied together. It toggles on every active edge while T is high. */
export interface TFlipFlopCell extends ClockedCell {
  kind: 't-flip-flop';
  t: string;
  initial?: boolean;
}

export interface RegisterCell extends ClockedCell {
  kind: 'register';
  width: number;
  d: string[];
  initial?: boolean[];
}

export interface CounterCell extends ClockedCell {
  kind: 'counter';
  width: number;
  direction?: 'up' | 'down' | string;
  initial?: number;
}

export interface ShiftRegisterCell extends ClockedCell {
  kind: 'shift-register';
  width: number;
  serialIn: string;
  direction?: 'left' | 'right';
  initial?: boolean[];
}

export interface FsmTransition {
  from: string;
  to: string;
  /** All named signals must equal these levels for the transition to fire. */
  when?: Record<string, boolean>;
}

export interface FsmCell extends ClockedCell {
  kind: 'fsm';
  initial: string;
  states: string[];
  transitions: FsmTransition[];
}

export type SequentialCell =
  | SrLatchCell
  | DLatchCell
  | DFlipFlopCell
  | JkFlipFlopCell
  | TFlipFlopCell
  | RegisterCell
  | CounterCell
  | ShiftRegisterCell
  | FsmCell;

/** Cells with no clock: they respond to levels, every step, rather than to edges. */
type UnclockedCell = SrLatchCell | DLatchCell;
const isUnclocked = (cell: SequentialCell): cell is UnclockedCell =>
  cell.kind === 'sr-latch' || cell.kind === 'd-latch';

export interface SequentialLogicDoc {
  inputs: LogicInput[];
  gates: LogicGate[];
  cells: SequentialCell[];
  outputs: LogicOutput[];
}

export interface SequentialState {
  /** Stored bits. A one-bit cell uses an array of length one. */
  bits: Record<string, boolean[]>;
  machines: Record<string, string>;
  /** Input levels from the preceding step, used for edge detection. */
  clocks: Record<string, boolean>;
  tick: number;
}

export interface SequentialSolution {
  state: SequentialState;
  outputs: Record<string, boolean>;
  signal: (reference: string) => boolean;
  diagnostics: LogicDiagnostic[];
  valid: boolean;
}

export interface SequentialTraceEntry extends SequentialSolution {
  inputs: Record<string, boolean>;
}

const widthOf = (cell: SequentialCell): number =>
  cell.kind === 'register' || cell.kind === 'counter' || cell.kind === 'shift-register' ? cell.width : 1;

const initialBits = (cell: SequentialCell): boolean[] => {
  const width = Math.max(1, widthOf(cell));
  if (cell.kind === 'counter') {
    const value = cell.initial ?? 0;
    return Array.from({ length: width }, (_, bit) => Math.floor(value / 2 ** bit) % 2 === 1);
  }
  if (cell.kind === 'register' || cell.kind === 'shift-register') {
    return Array.from({ length: width }, (_, bit) => cell.initial?.[bit] ?? false);
  }
  // A state machine stores its state by NAME in `machines`, never as bits, so its
  // `initial` is a state label rather than a level and contributes no stored bit.
  if (cell.kind === 'fsm') return [];
  return [cell.initial ?? false];
};

export function createSequentialState(doc: SequentialLogicDoc): SequentialState {
  return {
    bits: Object.fromEntries(doc.cells.map((cell) => [cell.id, initialBits(cell)])),
    machines: Object.fromEntries(
      doc.cells.filter((cell): cell is FsmCell => cell.kind === 'fsm').map((cell) => [cell.id, cell.initial]),
    ),
    clocks: {},
    tick: 0,
  };
}

/** Read `cell`, `cell[0]`, `cell.q`, or a primary/combinational signal. */
function stateSignals(state: SequentialState): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [id, bits] of Object.entries(state.bits)) {
    result[id] = bits[0] ?? false;
    result[`${id}.q`] = bits[0] ?? false;
    result[`${id}.notQ`] = !(bits[0] ?? false);
    bits.forEach((bit, index) => (result[`${id}[${index}]`] = bit));
  }
  for (const [id, current] of Object.entries(state.machines)) {
    result[id] = true;
    result[`${id}.${current}`] = true;
  }
  return result;
}

function settle(doc: SequentialLogicDoc, state: SequentialState, inputs: Record<string, boolean>) {
  const stored = stateSignals(state);
  for (const cell of doc.cells) {
    if (cell.kind !== 'fsm') continue;
    for (const stateName of cell.states)
      stored[`${cell.id}.${stateName}`] = state.machines[cell.id] === stateName;
  }
  const primary = Object.fromEntries(
    doc.inputs.map((input) => [input.id, inputs[input.id] ?? input.value ?? false]),
  );
  const injected: LogicInput[] = Object.entries({ ...stored, ...primary }).map(([id, value]) => ({
    id,
    value,
  }));
  const solution = evaluate({ inputs: injected, gates: doc.gates, outputs: doc.outputs });
  const signal = (reference: string) => {
    if (reference in primary) return primary[reference] ?? false;
    if (reference in stored) return stored[reference] ?? false;
    return solution.value(reference);
  };
  return { solution, signal, primary };
}

export function observeSequential(
  doc: SequentialLogicDoc,
  state: SequentialState = createSequentialState(doc),
  inputs: Record<string, boolean> = {},
): SequentialSolution {
  const settled = settle(doc, state, inputs);
  return {
    state,
    outputs: settled.solution.outputs,
    signal: settled.signal,
    diagnostics: settled.solution.diagnostics,
    valid: settled.solution.valid,
  };
}

const activeEdge = (edge: ClockEdge | undefined, before: boolean, after: boolean) =>
  edge === 'falling' ? before && !after : !before && after;

const enabled = (reference: string | undefined, signal: (id: string) => boolean) =>
  reference === undefined || signal(reference);

const unsigned = (bits: boolean[]) => bits.reduce((sum, bit, index) => sum + (bit ? 2 ** index : 0), 0);
const toBits = (value: number, width: number) =>
  Array.from({ length: width }, (_, bit) => Math.floor(value / 2 ** bit) % 2 === 1);

/** Advance one discrete instant and atomically commit every cell's next state. */
export function stepSequential(
  doc: SequentialLogicDoc,
  previous: SequentialState = createSequentialState(doc),
  inputs: Record<string, boolean> = {},
): SequentialSolution {
  const { signal, solution, primary } = settle(doc, previous, inputs);
  const nextBits = Object.fromEntries(Object.entries(previous.bits).map(([id, bits]) => [id, [...bits]]));
  const nextMachines = { ...previous.machines };

  for (const cell of doc.cells) {
    if (cell.kind === 'sr-latch') {
      const set = signal(cell.set) !== Boolean(cell.activeLow);
      const reset = signal(cell.reset) !== Boolean(cell.activeLow);
      if (set && reset) {
        solution.diagnostics.push({
          code: 'invalid-sr-input',
          nodeId: cell.id,
          message: `Invalid SR latch condition at "${cell.id}": set and reset are both active.`,
        });
      } else if (set) nextBits[cell.id] = [true];
      else if (reset) nextBits[cell.id] = [false];
      continue;
    }

    if (cell.kind === 'd-latch') {
      if (signal(cell.enable)) nextBits[cell.id] = [signal(cell.d)];
      continue;
    }

    const resetActive = Boolean(cell.reset && signal(cell.reset));
    if (resetActive && cell.resetMode === 'asynchronous') {
      if (cell.kind === 'fsm') nextMachines[cell.id] = cell.initial;
      else if (cell.kind === 'd-flip-flop') nextBits[cell.id] = [cell.resetValue ?? false];
      else nextBits[cell.id] = Array.from({ length: widthOf(cell) }, () => false);
      continue;
    }

    const clockNow = signal(cell.clock);
    const clockBefore = previous.clocks[cell.clock] ?? false;
    if (!activeEdge(cell.edge, clockBefore, clockNow)) continue;
    if (resetActive) {
      if (cell.kind === 'fsm') nextMachines[cell.id] = cell.initial;
      else if (cell.kind === 'd-flip-flop') nextBits[cell.id] = [cell.resetValue ?? false];
      else nextBits[cell.id] = Array.from({ length: widthOf(cell) }, () => false);
      continue;
    }
    if (cell.kind !== 'fsm' && !enabled(cell.enable, signal)) continue;

    if (cell.kind === 'd-flip-flop') nextBits[cell.id] = [signal(cell.d)];
    else if (cell.kind === 'jk-flip-flop') {
      const q = previous.bits[cell.id]?.[0] ?? false;
      const j = signal(cell.j);
      const k = signal(cell.k);
      nextBits[cell.id] = [j && k ? !q : j ? true : k ? false : q];
    } else if (cell.kind === 't-flip-flop') {
      const q = previous.bits[cell.id]?.[0] ?? false;
      nextBits[cell.id] = [signal(cell.t) ? !q : q];
    } else if (cell.kind === 'register') {
      nextBits[cell.id] = Array.from({ length: cell.width }, (_, bit) => signal(cell.d[bit] ?? ''));
    } else if (cell.kind === 'counter') {
      const modulus = 2 ** cell.width;
      const down =
        cell.direction === 'down' || (typeof cell.direction === 'string' && signal(cell.direction));
      const value = (unsigned(previous.bits[cell.id] ?? []) + (down ? -1 : 1) + modulus) % modulus;
      nextBits[cell.id] = toBits(value, cell.width);
    } else if (cell.kind === 'shift-register') {
      const bits = [...(previous.bits[cell.id] ?? initialBits(cell))];
      nextBits[cell.id] =
        cell.direction === 'left'
          ? [signal(cell.serialIn), ...bits.slice(0, cell.width - 1)]
          : [...bits.slice(1), signal(cell.serialIn)];
    } else {
      const current = previous.machines[cell.id] ?? cell.initial;
      const transition = cell.transitions.find(
        (item) =>
          item.from === current &&
          Object.entries(item.when ?? {}).every(([id, value]) => signal(id) === value),
      );
      nextMachines[cell.id] = transition?.to ?? current;
    }
  }

  const next: SequentialState = {
    bits: nextBits,
    machines: nextMachines,
    clocks: {
      ...previous.clocks,
      ...primary,
      ...Object.fromEntries(
        doc.cells
          .filter((cell): cell is Exclude<SequentialCell, UnclockedCell> => !isUnclocked(cell))
          .map((cell) => [cell.clock, signal(cell.clock)]),
      ),
    },
    tick: previous.tick + 1,
  };
  return observeSequential(doc, next, inputs);
}

export function readUnsigned(state: SequentialState, cellId: string): number {
  return unsigned(state.bits[cellId] ?? []);
}

export function machineIs(state: SequentialState, cellId: string, stateName: string): boolean {
  return state.machines[cellId] === stateName;
}

/** Replay authored vectors into a stable trace for lessons, grading, and transcripts. */
export function sequenceTable(
  doc: SequentialLogicDoc,
  vectors: Record<string, boolean>[],
  initial: SequentialState = createSequentialState(doc),
): SequentialTraceEntry[] {
  const trace: SequentialTraceEntry[] = [];
  let state = initial;
  for (const inputs of vectors) {
    const solution = stepSequential(doc, state, inputs);
    state = solution.state;
    trace.push({ ...solution, inputs: { ...inputs } });
  }
  return trace;
}
