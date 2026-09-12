import { describe, expect, it } from 'vitest';
import {
  RESET_STATE,
  SET_STATE,
  delaysToSettle,
  latchDelay,
  latchMode,
  runLatch,
  settleLatch,
} from '../src/logic/latch.js';

describe('the four input combinations', () => {
  it('names them', () => {
    expect(latchMode({ s: true, r: false })).toBe('set');
    expect(latchMode({ s: false, r: true })).toBe('reset');
    expect(latchMode({ s: false, r: false })).toBe('hold');
    expect(latchMode({ s: true, r: true })).toBe('forbidden');
  });

  it('sets Q high from the reset state, and takes two gate delays to do it', () => {
    const result = settleLatch({ s: true, r: false }, RESET_STATE);
    expect(result.final).toEqual(SET_STATE);
    expect(result.stable).toBe(true);
    // Q̅ falls first (S drives it directly), THEN Q rises because Q̅ fell. The order is the lesson.
    expect(result.steps[1]).toEqual({ q: false, nq: false });
    expect(result.steps[2]).toEqual({ q: true, nq: false });
    expect(delaysToSettle(result)).toBe(2);
  });

  it('resets Q low from the set state', () => {
    expect(settleLatch({ s: false, r: true }, SET_STATE).final).toEqual(RESET_STATE);
  });
});

describe('why it remembers', () => {
  it('holds a stored 1 with both inputs released, and changes nothing to do it', () => {
    const result = settleLatch({ s: false, r: false }, SET_STATE);
    expect(result.final).toEqual(SET_STATE);
    expect(delaysToSettle(result)).toBe(0);
  });

  it('holds a stored 0 just as happily', () => {
    expect(settleLatch({ s: false, r: false }, RESET_STATE).final).toEqual(RESET_STATE);
  });

  it('gives DIFFERENT outputs for the SAME inputs, which no combinational circuit can do', () => {
    // This is the definition of memory: identical inputs, and the output depends on the past.
    const afterSet = runLatch([
      { s: true, r: false },
      { s: false, r: false },
    ]);
    const afterReset = runLatch([
      { s: false, r: true },
      { s: false, r: false },
    ]);
    expect(afterSet.at(-1)!.final.q).toBe(true);
    expect(afterReset.at(-1)!.final.q).toBe(false);
  });

  it('keeps each resting state in place because each gate is held by the other one', () => {
    // Q = NOR(R, Q̅). With R low, Q is simply NOT Q̅, and Q̅ is NOT Q. Each justifies the other.
    expect(latchDelay({ s: false, r: false }, SET_STATE)).toEqual(SET_STATE);
    expect(latchDelay({ s: false, r: false }, RESET_STATE)).toEqual(RESET_STATE);
  });
});

describe('the forbidden input', () => {
  it('forces BOTH outputs low, breaking the promise that Q̅ is the opposite of Q', () => {
    const result = settleLatch({ s: true, r: true }, SET_STATE);
    expect(result.final).toEqual({ q: false, nq: false });
    expect(result.complementary).toBe(false);
    expect(result.stable).toBe(true);
  });

  it('oscillates when both inputs are released at the same instant', () => {
    const forced = settleLatch({ s: true, r: true }, SET_STATE).final;
    const released = settleLatch({ s: false, r: false }, forced);
    expect(released.stable).toBe(false);
    expect(released.oscillating).toBe(true);
    // Both rise together, then both fall together: the square wave a scope would show.
    expect(released.steps.slice(0, 4)).toEqual([
      { q: false, nq: false },
      { q: true, nq: true },
      { q: false, nq: false },
      { q: true, nq: true },
    ]);
    expect(delaysToSettle(released)).toBeUndefined();
  });

  it('settles cleanly if the inputs are released one at a time, so the ORDER decided it', () => {
    const forced = settleLatch({ s: true, r: true }, RESET_STATE).final;
    // Drop R first while S stays high (a plain set), then drop S. No race, because only one
    // input ever changes at a time.
    const ended = runLatch(
      [
        { s: true, r: false },
        { s: false, r: false },
      ],
      forced,
    ).at(-1)!;
    expect(ended.final).toEqual(SET_STATE);
    expect(ended.stable).toBe(true);
  });
});

describe('the model is honest about time', () => {
  it('updates both gates from the same previous values, so no race is hidden by line order', () => {
    // A sequential update would compute Q from the old Q̅ and then Q̅ from the NEW Q, and settle the
    // forbidden release immediately. Simultaneous update is what makes the oscillation visible.
    const next = latchDelay({ s: false, r: false }, { q: false, nq: false });
    expect(next).toEqual({ q: true, nq: true });
  });

  it('never runs past its delay budget', () => {
    const forced = { q: false, nq: false };
    expect(settleLatch({ s: false, r: false }, forced, 3).steps.length).toBeLessThanOrEqual(5);
  });
});
