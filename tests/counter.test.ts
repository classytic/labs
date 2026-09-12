import { describe, expect, it } from 'vitest';
import {
  detectBits,
  detectLabel,
  modCounterDoc,
  runCounter,
  stagesFor,
  toBinary,
  transitions,
} from '../src/logic/counter.js';

describe('a full 4-bit counter', () => {
  const run = runCounter(16, 16);

  it('counts 0 to 15 and wraps', () => {
    expect(run.counts).toEqual(Array.from({ length: 16 }, (_, n) => n));
    expect(runCounter(16, 18).counts.slice(15)).toEqual([15, 0, 1]);
  });

  it('halves the frequency at every stage, which is why it is also a divider', () => {
    // 16 periods hold 16 rising edges. Q0 changes on every one, Q1 on every second, and so on.
    expect(run.bits.map(transitions)).toEqual([16, 8, 4, 2]);
  });

  it('only changes its bits on rising edges', () => {
    for (const wave of run.bits) {
      wave.forEach((level, t) => {
        if (t > 0 && level !== wave[t - 1]) expect(run.clock[t]).toBe(true);
      });
    }
  });

  it('needs no reset gate, because 16 is where 4 bits wrap on their own', () => {
    expect(modCounterDoc(16).gates).toEqual([]);
  });
});

describe('stopping at a number that is not a power of two', () => {
  it('makes a decade counter from one AND gate reading Q3 and Q0', () => {
    expect(detectBits(10)).toEqual([0, 3]); // 9 = 1001
    expect(detectLabel(10)).toBe('Q3 and Q0');
    expect(runCounter(10, 12).counts).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]);
  });

  it('never shows a count at or past the modulus, for every modulus', () => {
    for (let modulus = 2; modulus <= 16; modulus++) {
      const counts = runCounter(modulus, 40).counts;
      expect(Math.max(...counts)).toBe(modulus - 1);
      expect(counts.every((count) => count < modulus)).toBe(true);
    }
  });

  it('only needs the 1-bits of the last count, because no smaller count has them all', () => {
    for (let modulus = 2; modulus <= 16; modulus++) {
      const bits = detectBits(modulus);
      for (let count = 0; count < modulus - 1; count++) {
        const allSet = bits.every((bit) => Math.floor(count / 2 ** bit) % 2 === 1);
        expect(allSet).toBe(false);
      }
    }
  });

  it('uses a plain wire when the last count has a single 1 bit', () => {
    // Mod 5 resets after 4 = 100, so Q2 alone is the terminal-count signal.
    expect(detectBits(5)).toEqual([2]);
    expect(modCounterDoc(5).gates[0]!.kind).toBe('buffer');
    expect(runCounter(5, 7).counts).toEqual([0, 1, 2, 3, 4, 0, 1]);
  });

  it('resets on the edge AFTER the last count, so the last count is held for a full period', () => {
    const run = runCounter(6, 8);
    expect(run.counts).toEqual([0, 1, 2, 3, 4, 5, 0, 1]);
  });
});

describe('the quartz watch', () => {
  it('turns 32,768 vibrations a second into one tick with 15 stages', () => {
    expect(stagesFor(32768)).toBe(15);
    expect(stagesFor(1000)).toBeUndefined();
  });
});

describe('formatting', () => {
  it('writes counts as 4-bit binary', () => {
    expect(toBinary(9)).toBe('1001');
    expect(toBinary(0)).toBe('0000');
  });
});
