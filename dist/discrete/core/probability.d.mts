//#region src/discrete/core/probability.d.ts
/**
 * Probability kernel, equally-likely sample spaces, conditioning, Bayes,
 * independence, expectation. This is the "truth" the base-rate / Monty labs read
 * (the agent narrates these numbers; it never invents them). Conditioning =
 * shrink the sample space: P(A|B) = |A∩B| / |B|.
 */
/** Favourable / total over an equally-likely space. */
declare function probability(favorable: number, total: number): number;
declare function complement(p: number): number;
/** P(A|B) = P(A∩B) / P(B), restrict the world to B, then re-count. */
declare function conditional(pAandB: number, pB: number): number;
/**
 * P(A|B) from the natural inputs: the true-positive rate P(B|A), the prior P(A),
 * and the false-positive rate P(B|¬A). The base-rate-neglect engine.
 */
declare function bayes(pBgivenA: number, pA: number, pBgivenNotA: number): number;
/** A and B are independent iff P(A∩B) = P(A)·P(B) (within eps). NOT the same as
 *  disjoint, disjoint events are maximally DEPENDENT. */
declare function independent(pA: number, pB: number, pAandB: number, eps?: number): boolean;
/** Expected value Σ p·value (probabilities should sum to 1). */
declare function expectedValue(outcomes: ReadonlyArray<{
  p: number;
  value: number;
}>): number;
/** "At least one" via the complement: 1 − (1−p)^n. */
declare function atLeastOne(pEach: number, n: number): number;
//#endregion
export { atLeastOne, bayes, complement, conditional, expectedValue, independent, probability };