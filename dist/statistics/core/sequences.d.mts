//#region src/statistics/core/sequences.d.ts
/**
 * Sequences & series kernel, arithmetic and geometric, the two patterns every
 * series lesson rests on. Pure functions: the nth term, the first n terms, and
 * the partial sum (closed form), plus the geometric infinite-sum (|r|<1). The
 * lab draws bars/areas from `terms()` and proves the closed form against the
 * brute sum, so the visual and the formula stay in lockstep.
 */
type SeqKind = 'arithmetic' | 'geometric';
interface SeqSpec {
  kind: SeqKind;
  first: number;
  step: number;
}
/** The nth term (1-indexed): aₙ = a₁+(n−1)d  |  aₙ = a₁·r^(n−1). */
declare function nthTerm(spec: SeqSpec, n: number): number;
/** The first `count` terms (1-indexed). */
declare function terms(spec: SeqSpec, count: number): number[];
/** Partial sum of the first n terms, closed form.
 *  arithmetic: n/2·(2a₁+(n−1)d).  geometric: a₁·(1−rⁿ)/(1−r)  (n·a₁ when r=1). */
declare function partialSum(spec: SeqSpec, n: number): number;
/** Running partial sums S₁…S_count (for the convergence/area visual). */
declare function partialSums(spec: SeqSpec, count: number): number[];
/** Sum to infinity of a geometric series, or null if it diverges (|r| ≥ 1). */
declare function infiniteSum(spec: SeqSpec): number | null;
//#endregion
export { SeqKind, SeqSpec, infiniteSum, nthTerm, partialSum, partialSums, terms };