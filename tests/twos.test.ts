import { describe, expect, it } from 'vitest';
import {
  RANGE,
  add,
  bitsOf,
  crossesOverflowLine,
  fromSigned,
  inRange,
  negate,
  subtract,
  toSigned,
} from '../src/logic/twos.js';

const ALL = Array.from({ length: 16 }, (_, p) => p);

describe('naming the patterns', () => {
  it('reads the top half as negative', () => {
    expect(toSigned(0b0111)).toBe(7);
    expect(toSigned(0b1000)).toBe(-8);
    expect(toSigned(0b1111)).toBe(-1);
    expect(bitsOf(fromSigned(-3))).toBe('1101');
  });

  it('runs from −8 to 7, one more negative than positive', () => {
    expect(RANGE).toEqual({ min: -8, max: 7 });
    expect(ALL.map(toSigned).sort((x, y) => x - y)).toEqual(Array.from({ length: 16 }, (_, i) => i - 8));
  });
});

describe('invert and add one', () => {
  it('turns every value into its negative, because x plus its inverse is always 1111', () => {
    for (const p of ALL) {
      expect(add(p, negate(p).inverted).result).toBe(0b1111); // −1, whatever p is
      expect(add(p, negate(p).result).result).toBe(0); // so x + (inverse + 1) = 0
    }
  });

  it('gives −8 back when you negate it, the one pattern with no partner', () => {
    const n = negate(0b1000);
    expect(n.result).toBe(0b1000);
    expect(n.overflow).toBe(true);
    expect(ALL.filter((p) => negate(p).result === p)).toEqual([0, 0b1000]);
  });
});

describe('one adder for both jobs', () => {
  it('subtracts by adding the negation, correct whenever the answer fits', () => {
    for (const a of ALL) {
      for (const b of ALL) {
        const truth = toSigned(a) - toSigned(b);
        const got = subtract(a, b);
        if (inRange(truth)) expect(toSigned(got.result)).toBe(truth);
      }
    }
  });

  it('flags overflow exactly when the true signed sum does not fit', () => {
    for (const a of ALL) {
      for (const b of ALL) {
        const truth = toSigned(a) + toSigned(b);
        expect(add(a, b).overflow).toBe(!inRange(truth));
      }
    }
  });

  it('matches the wheel: a signed walk crosses the red line exactly when the adder overflows', () => {
    for (const a of ALL) {
      for (const b of ALL) expect(crossesOverflowLine(a, b)).toBe(add(a, b).overflow);
    }
  });

  it('turns 7 + 1 into −8, the classic overflow', () => {
    const sum = add(0b0111, 0b0001);
    expect(bitsOf(sum.result)).toBe('1000');
    expect(toSigned(sum.result)).toBe(-8);
    expect(sum.overflow).toBe(true);
  });

  it('lets a carry out happen WITHOUT overflow, which is why the carry is not the warning', () => {
    const sum = add(fromSigned(-1), fromSigned(1)); // 1111 + 0001
    expect(sum.carryOut).toBe(true);
    expect(sum.overflow).toBe(false);
    expect(sum.result).toBe(0);
  });
});
