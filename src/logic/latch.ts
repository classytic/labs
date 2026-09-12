/**
 * The SR latch, built from two NOR gates and simulated one gate delay at a time.
 *
 * The sequential engine already has an `sr-latch` cell, and it is correct, but it is a box: it
 * stores a bit because the code says so. A student asked "why does it remember?" gets nothing from
 * a box. This model is the circuit itself, two cross-coupled NOR gates, and the answer falls out
 * of it: with both inputs low, each gate's output is decided by the OTHER gate's output, so
 * whichever state the pair is already in keeps itself there.
 *
 * Two deliberate choices make the model honest rather than tidy.
 *
 * First, time moves in GATE DELAYS and both gates update together. Evaluating one gate and then
 * the other (the natural way to write it) quietly resolves races by line order. Real gates switch
 * at the same moment, so they are updated from the same previous values here.
 *
 * Second, that makes the forbidden input behave as it does on a bench. With S and R both high,
 * both outputs are forced low. Release both at once and each gate sees two lows, so both rise,
 * then each sees a high, so both fall, forever. Symmetric gates have no reason to settle, and in
 * real hardware the winner is decided by whichever gate happens to be a few picoseconds faster.
 * That is why the input is forbidden, and the lab can show it instead of asserting it.
 */

export interface LatchLevels {
  q: boolean;
  nq: boolean;
}

export interface LatchInputs {
  s: boolean;
  r: boolean;
}

export type LatchMode = 'set' | 'reset' | 'hold' | 'forbidden';

export const latchMode = ({ s, r }: LatchInputs): LatchMode =>
  s && r ? 'forbidden' : s ? 'set' : r ? 'reset' : 'hold';

/** One gate delay: both NOR gates read the same previous outputs and switch together. */
export const latchDelay = ({ s, r }: LatchInputs, { q, nq }: LatchLevels): LatchLevels => ({
  q: !(r || nq),
  nq: !(s || q),
});

export interface LatchSettle {
  /** `steps[0]` is the state before the inputs changed; `steps[k]` is after k gate delays. */
  steps: LatchLevels[];
  stable: boolean;
  /** The pair revisited a state that is not a resting one, so it will cycle forever. */
  oscillating: boolean;
  final: LatchLevels;
  /** Q and Q̅ disagree, which is the one promise a latch makes. False only when both are equal. */
  complementary: boolean;
}

const same = (a: LatchLevels, b: LatchLevels): boolean => a.q === b.q && a.nq === b.nq;

/**
 * Apply new input levels and run gate delays until the outputs stop changing, or until the pair
 * repeats a state it has already left, which means it never will stop.
 */
export function settleLatch(inputs: LatchInputs, from: LatchLevels, maxDelays = 8): LatchSettle {
  const steps: LatchLevels[] = [from];
  let stable = false;
  let oscillating = false;
  for (let delay = 0; delay < maxDelays; delay++) {
    const current = steps[steps.length - 1]!;
    const next = latchDelay(inputs, current);
    if (same(next, current)) {
      stable = true;
      break;
    }
    // A repeat of an EARLIER state that did not rest is a cycle. Record it so the picture shows
    // the flip happen at least twice, which is what makes it read as a loop rather than a glitch.
    const seenBefore = steps.slice(0, -1).some((earlier) => same(earlier, next));
    steps.push(next);
    if (seenBefore) {
      oscillating = true;
      steps.push(latchDelay(inputs, next));
      break;
    }
  }
  const final = steps[steps.length - 1]!;
  return { steps, stable, oscillating, final, complementary: final.q !== final.nq };
}

/** The two resting states of a latch with both inputs released. */
export const RESET_STATE: LatchLevels = { q: false, nq: true };
export const SET_STATE: LatchLevels = { q: true, nq: false };

/**
 * What a sequence of input changes does, one settle per change. Each entry starts from where the
 * previous one ended, which is the whole point: a latch's output depends on its history.
 */
export function runLatch(sequence: LatchInputs[], from: LatchLevels = RESET_STATE): LatchSettle[] {
  const results: LatchSettle[] = [];
  let state = from;
  for (const inputs of sequence) {
    const result = settleLatch(inputs, state);
    results.push(result);
    state = result.final;
  }
  return results;
}

/** Gate delays until the outputs stop changing. Undefined when they never do. */
export const delaysToSettle = (result: LatchSettle): number | undefined =>
  result.stable ? result.steps.length - 1 : undefined;
