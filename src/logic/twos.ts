/**
 * Two's complement on four bits: negative numbers without a minus sign.
 *
 * Put the sixteen 4-bit patterns round a circle, like the hours on a clock. Adding is walking
 * clockwise, and the circle wraps, because a 4-bit adder simply drops the fifth bit. Two's
 * complement is nothing more than a choice of how to NAME the patterns: the half from 1000 to 1111
 * is read as −8 to −1 instead of 8 to 15, so that walking clockwise past 1111 into 0000 is just
 * −1 + 1 = 0. The adder never changes. That is the whole reason every processor uses it.
 *
 * Three facts fall out, and each is pinned by a test:
 *
 * - Inverting a pattern and adding it to itself always gives 1111, which is −1. So −x is the
 *   inverse plus one. That is the rule students memorise, derived in one line.
 * - Subtraction is addition of the negation, on the SAME adder.
 * - The range is −8 to 7, not −7 to 7, because zero sits in the non-negative half. −8 is the one
 *   pattern with no positive partner: negating it gives it back, which is an overflow.
 *
 * Overflow is reported the way hardware detects it, carry into the top bit disagreeing with carry
 * out of it, and checked against the arithmetic answer for every pair.
 */

export const WIDTH = 4;
const MOD = 2 ** WIDTH;
const MIN = -(2 ** (WIDTH - 1));
const MAX = 2 ** (WIDTH - 1) - 1;

/** The pattern read as an unsigned number, 0 to 15. */
export type Pattern = number;

export const toSigned = (pattern: Pattern): number => (pattern >= MOD / 2 ? pattern - MOD : pattern);
export const fromSigned = (value: number): Pattern => ((value % MOD) + MOD) % MOD;
export const bitsOf = (pattern: Pattern): string => pattern.toString(2).padStart(WIDTH, '0');
export const inRange = (value: number): boolean => value >= MIN && value <= MAX;
export const RANGE = { min: MIN, max: MAX };

export interface Negation {
  inverted: Pattern;
  result: Pattern;
  /** Negating −8 gives −8 back: there is no +8 to give. */
  overflow: boolean;
}

export function negate(pattern: Pattern): Negation {
  const inverted = ~pattern & (MOD - 1);
  const result = (inverted + 1) % MOD;
  return { inverted, result, overflow: toSigned(pattern) === MIN };
}

export interface Sum {
  a: Pattern;
  b: Pattern;
  result: Pattern;
  /** The carry out of the top bit, which a 4-bit adder drops. */
  carryOut: boolean;
  carryIntoTop: boolean;
  /** Carry into the top bit differs from carry out: the signed answer does not fit. */
  overflow: boolean;
}

/** A 4-bit ripple adder, bit by bit, so the carries are real rather than inferred. */
export function add(a: Pattern, b: Pattern): Sum {
  let carry = 0;
  let result = 0;
  let carryIntoTop = false;
  for (let bit = 0; bit < WIDTH; bit++) {
    if (bit === WIDTH - 1) carryIntoTop = carry === 1;
    const x = (a >> bit) & 1;
    const y = (b >> bit) & 1;
    const total = x + y + carry;
    result |= (total & 1) << bit;
    carry = total >> 1;
  }
  const carryOut = carry === 1;
  return { a, b, result, carryOut, carryIntoTop, overflow: carryIntoTop !== carryOut };
}

/**
 * Does walking from `a` by the SIGNED value of `b` (forward if positive, back if negative) cross the
 * line between 7 and −8? That is the rule the wheel draws, and it must agree with the adder's
 * overflow flag for every pair, or the picture is teaching something the hardware does not do.
 */
export function crossesOverflowLine(a: Pattern, b: Pattern): boolean {
  const start = toSigned(a);
  const step = toSigned(b);
  // Walking in signed space leaves the range exactly when it crosses the 7 | −8 line.
  return !inRange(start + step);
}

/** a − b on the same adder: add the negation of b. */
export function subtract(a: Pattern, b: Pattern): Sum & { negated: Negation } {
  const negated = negate(b);
  return { ...add(a, negated.result), negated };
}
