import { describe, expect, it } from 'vitest';
import { fromBits, runShift, sendOrderFor, toBits } from '../src/logic/shift.js';

describe('a serial-in, parallel-out shift register', () => {
  it('starts empty', () => {
    expect(fromBits(runShift([])[0]!.stages)).toBe('0000');
  });

  it('moves every stored bit one stage along on each edge', () => {
    const history = runShift(toBits('1000'));
    expect(history.map((snapshot) => fromBits(snapshot.stages))).toEqual([
      '0000',
      '1000',
      '0100',
      '0010',
      '0001',
    ]);
  });

  it('holds the first bit sent at the FAR end, so the word arrives reversed', () => {
    // Send 1, 0, 1, 1. The last bit sent is at the entry stage and the first is at the far end.
    const last = runShift(toBits('1011')).at(-1)!;
    expect(fromBits(last.stages)).toBe('1101');
  });

  it('pushes the oldest bit out of the far end on the fifth edge', () => {
    const history = runShift(toBits('10110'));
    expect(history[5]!.out).toBe(true); // the first bit sent, a 1, falls off
    expect(history[4]!.out).toBe(false); // nothing had reached the end before that
  });

  it('loads any pattern if the bits are sent in reverse', () => {
    for (let value = 0; value < 16; value++) {
      const target = value.toString(2).padStart(4, '0');
      const loaded = runShift(sendOrderFor(toBits(target))).at(-1)!;
      expect(fromBits(loaded.stages)).toBe(target);
    }
  });

  it('works at other widths, as the 8-bit chips do', () => {
    const last = runShift(toBits('10000000'), 8).at(-1)!;
    expect(fromBits(last.stages)).toBe('00000001');
  });
});
