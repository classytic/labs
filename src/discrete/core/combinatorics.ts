/**
 * Combinatorics kernel — the counting source-of-truth every discrete-math lab
 * trusts (so an agent narrates these, never computes its own). Pure, integer,
 * dependency-free. The headline identity the Counting lab is built on:
 *   nCr(n,k) = nPr(n,k) / k!   ("overcount by order, then divide it out").
 */

const isCount = (n: number): boolean => Number.isInteger(n) && n >= 0;

export function factorial(n: number): number {
  if (!isCount(n)) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Ordered selections: n·(n−1)···(n−r+1). */
export function nPr(n: number, r: number): number {
  if (!isCount(n) || !isCount(r) || r > n) return r > n ? 0 : NaN;
  let r0 = 1;
  for (let i = 0; i < r; i++) r0 *= n - i;
  return r0;
}

/** Unordered selections: nPr/k!, via the exact step-wise multiplicative form. */
export function nCr(n: number, r: number): number {
  if (!isCount(n) || !isCount(r)) return NaN;
  if (r > n) return 0;
  const k = Math.min(r, n - r);          // symmetry C(n,k)=C(n,n−k)
  let res = 1;
  for (let i = 1; i <= k; i++) res = (res * (n - k + i)) / i;   // exact at each step
  return Math.round(res);
}

/** Binomial coefficient — alias of nCr (the "n choose k"). */
export const binomial = nCr;

/** Arrangements of a multiset: n! / (k1! k2! …), where Σki = n. */
export function multinomial(...counts: number[]): number {
  const n = counts.reduce((s, c) => s + c, 0);
  let res = factorial(n);
  for (const c of counts) res /= factorial(c);
  return Math.round(res);
}

/** Stars and bars: ways to place n identical items into k distinct bins =
 *  C(n+k−1, k−1). */
export function starsAndBars(n: number, k: number): number {
  if (!isCount(n) || !isCount(k) || k < 1) return NaN;
  return nCr(n + k - 1, k - 1);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}
