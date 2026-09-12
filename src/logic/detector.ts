/**
 * A sequence detector, generated from the pattern it detects.
 *
 * "Design a Moore machine that outputs 1 whenever the input has just ended in 101" is the state
 * machine question of a first digital logic course. Students are taught to draw it by hand and
 * usually get the states right and the backward arrows wrong: after a wrong bit they send the
 * machine all the way back to the start, when some of what it has already seen may still be the
 * beginning of the next match.
 *
 * So the machine here is BUILT from the pattern, by the rule the hand design is meant to follow:
 * state k means "the last k bits are the first k bits of the pattern". Every transition goes to the
 * longest part of the pattern that the bits seen so far could still be the start of. That is the
 * same rule as the failure function in KMP string matching, which is worth knowing is the same idea
 * when a student meets it again in an algorithms course.
 *
 * Overlapping and non-overlapping detection differ only in what happens after a match. Overlapping
 * keeps the tail of the match as a possible head of the next one; non-overlapping throws it away.
 */

export interface DetectorState {
  id: number;
  /** The part of the pattern matched so far. "" is the start state. */
  matched: string;
  /** Moore output: 1 only in the final state. */
  output: boolean;
}

/**
 * Moore puts the output in a STATE, so it needs a state that means "just found it". Mealy puts the
 * output on the ARROW that completes the pattern, so it needs one fewer state and answers on the
 * same clock as the last bit. Same input, same detections, different shape: which is exactly the
 * comparison a first course asks for.
 */
export type MachineKind = 'moore' | 'mealy';

export interface Detector {
  kind: MachineKind;
  pattern: string;
  overlap: boolean;
  states: DetectorState[];
  /** `next[state][bit]`, bit being 0 or 1. */
  next: [number, number][];
  /** Mealy only: `outputs[state][bit]` is the output on that arrow. All false for Moore. */
  outputs: [boolean, boolean][];
}

/** Longest prefix of `pattern` that is also a suffix of `seen`, as a length. */
function longestPrefixSuffix(pattern: string, seen: string): number {
  for (let length = Math.min(pattern.length, seen.length); length > 0; length--) {
    if (seen.endsWith(pattern.slice(0, length))) return length;
  }
  return 0;
}

export function buildDetector(pattern: string, overlap = true, kind: MachineKind = 'moore'): Detector {
  if (!/^[01]+$/.test(pattern)) throw new Error(`A pattern is a string of 0s and 1s, got "${pattern}".`);
  const n = pattern.length;
  if (kind === 'mealy') {
    // States 0..n-1 only. Completing the pattern is an ARROW with output 1, which lands where the
    // match can continue: on the border for overlapping detection, at the start otherwise.
    const states: DetectorState[] = Array.from({ length: n }, (_, k) => ({
      id: k,
      matched: pattern.slice(0, k),
      output: false,
    }));
    const landing = overlap ? borderOf(pattern).length : 0;
    const move = (k: number, bit: '0' | '1'): { to: number; out: boolean } => {
      const reached = longestPrefixSuffix(pattern, pattern.slice(0, k) + bit);
      return reached === n ? { to: landing, out: true } : { to: reached, out: false };
    };
    const moves = states.map((state) => [move(state.id, '0'), move(state.id, '1')] as const);
    return {
      kind,
      pattern,
      overlap,
      states,
      next: moves.map(([zero, one]) => [zero.to, one.to] as [number, number]),
      outputs: moves.map(([zero, one]) => [zero.out, one.out] as [boolean, boolean]),
    };
  }
  const states: DetectorState[] = Array.from({ length: n + 1 }, (_, k) => ({
    id: k,
    matched: pattern.slice(0, k),
    output: k === n,
  }));
  const step = (k: number, bit: '0' | '1'): number => {
    // After a full match, non-overlapping detection forgets it and starts again from nothing.
    const from = k === n && !overlap ? '' : pattern.slice(0, k);
    return longestPrefixSuffix(pattern, from + bit);
  };
  const next = states.map((state) => [step(state.id, '0'), step(state.id, '1')] as [number, number]);
  return { kind, pattern, overlap, states, next, outputs: states.map(() => [false, false]) };
}

export interface DetectorRun {
  /** State before any input, then after each bit. */
  path: number[];
  /** Positions (0-based, into the input) at which the machine output a 1. */
  detections: number[];
}

export function runDetector(machine: Detector, bits: string): DetectorRun {
  const path = [0];
  const detections: number[] = [];
  for (let index = 0; index < bits.length; index++) {
    const bit = bits[index] === '1' ? 1 : 0;
    const from = path[path.length - 1]!;
    const state = machine.next[from]![bit]!;
    path.push(state);
    // Moore reads the output from where it lands; Mealy from the arrow it took to get there.
    const fired = machine.kind === 'mealy' ? machine.outputs[from]![bit]! : machine.states[state]!.output;
    if (fired) detections.push(index);
  }
  return { path, detections };
}

/** Transitions that go backwards, excluding self-loops. These are the ones students get wrong. */
export const backEdges = (machine: Detector): { from: number; bit: number; to: number }[] =>
  machine.next.flatMap(([zero, one], from) =>
    [
      { from, bit: 0, to: zero },
      { from, bit: 1, to: one },
    ].filter((edge) => edge.to < from),
  );

/**
 * The longest proper prefix of the pattern that is also a suffix of it: the part of the end of a
 * match that can start the next one. "1" for 101, "10" for 1010, "" for 110.
 */
export function borderOf(pattern: string): string {
  for (let length = pattern.length - 1; length > 0; length--) {
    if (pattern.endsWith(pattern.slice(0, length))) return pattern.slice(0, length);
  }
  return '';
}

/** Fewest further bits before the detector can output 1 again, straight after a match. */
export const bitsToFireAgain = (pattern: string, overlap: boolean): number =>
  overlap ? pattern.length - borderOf(pattern).length : pattern.length;

/** Back edges that do NOT return to the start: the ones a naive design misses. */
export const partialFallbacks = (machine: Detector): { from: number; bit: number; to: number }[] =>
  backEdges(machine).filter((edge) => edge.to > 0);
