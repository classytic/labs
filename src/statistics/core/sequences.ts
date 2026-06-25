/**
 * Sequences & series kernel — arithmetic and geometric, the two patterns every
 * series lesson rests on. Pure functions: the nth term, the first n terms, and
 * the partial sum (closed form), plus the geometric infinite-sum (|r|<1). The
 * lab draws bars/areas from `terms()` and proves the closed form against the
 * brute sum, so the visual and the formula stay in lockstep.
 */

export type SeqKind = 'arithmetic' | 'geometric';
export interface SeqSpec { kind: SeqKind; first: number; step: number } // step = common difference d OR common ratio r

/** The nth term (1-indexed): aₙ = a₁+(n−1)d  |  aₙ = a₁·r^(n−1). */
export function nthTerm(spec: SeqSpec, n: number): number {
  return spec.kind === 'arithmetic' ? spec.first + (n - 1) * spec.step : spec.first * spec.step ** (n - 1);
}

/** The first `count` terms (1-indexed). */
export function terms(spec: SeqSpec, count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => nthTerm(spec, i + 1));
}

/** Partial sum of the first n terms, closed form.
 *  arithmetic: n/2·(2a₁+(n−1)d).  geometric: a₁·(1−rⁿ)/(1−r)  (n·a₁ when r=1). */
export function partialSum(spec: SeqSpec, n: number): number {
  if (n <= 0) return 0;
  if (spec.kind === 'arithmetic') return (n / 2) * (2 * spec.first + (n - 1) * spec.step);
  const r = spec.step;
  return r === 1 ? n * spec.first : spec.first * (1 - r ** n) / (1 - r);
}

/** Running partial sums S₁…S_count (for the convergence/area visual). */
export function partialSums(spec: SeqSpec, count: number): number[] {
  const out: number[] = []; let acc = 0;
  for (let i = 1; i <= count; i++) { acc += nthTerm(spec, i); out.push(acc); }
  return out;
}

/** Sum to infinity of a geometric series, or null if it diverges (|r| ≥ 1). */
export function infiniteSum(spec: SeqSpec): number | null {
  if (spec.kind !== 'geometric') return null;
  return Math.abs(spec.step) < 1 ? spec.first / (1 - spec.step) : null;
}
