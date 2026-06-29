//#region src/discrete/core/combinatorics.d.ts
/**
 * Combinatorics kernel, the counting source-of-truth every discrete-math lab
 * trusts (so an agent narrates these, never computes its own). Pure, integer,
 * dependency-free. The headline identity the Counting lab is built on:
 *   nCr(n,k) = nPr(n,k) / k!   ("overcount by order, then divide it out").
 */
declare function factorial(n: number): number;
/** Ordered selections: n·(n−1)···(n−r+1). */
declare function nPr(n: number, r: number): number;
/** Unordered selections: nPr/k!, via the exact step-wise multiplicative form. */
declare function nCr(n: number, r: number): number;
/** Binomial coefficient, alias of nCr (the "n choose k"). */
declare const binomial: typeof nCr;
/** Arrangements of a multiset: n! / (k1! k2! …), where Σki = n. */
declare function multinomial(...counts: number[]): number;
/** Stars and bars: ways to place n identical items into k distinct bins =
 *  C(n+k−1, k−1). */
declare function starsAndBars(n: number, k: number): number;
/** Rule of PRODUCT (multiplication principle): a task done as a SEQUENCE of
 *  independent stages — do stage 1 AND stage 2 AND … — multiplies the choice
 *  counts. ruleOfProduct(4, 3, 2) = 24. The spine under nPr / nʳ / factorial. */
declare function ruleOfProduct(...stages: number[]): number;
/** Rule of SUM (addition principle): MUTUALLY EXCLUSIVE cases — do this OR that,
 *  with no overlap — add their counts. ruleOfSum(3, 5) = 8. If the cases can
 *  overlap, use {@link inclusionExclusion} (sum, then subtract the double-count). */
declare function ruleOfSum(...cases: number[]): number;
/** Permutations WITH repetition: r positions, each independently filled from n
 *  options = nʳ. PIN codes, license plates, binary strings, functions A→B. */
declare function permutationsWithRepetition(n: number, r: number): number;
/** Circular permutations: distinct arrangements of n around a round table where
 *  only RELATIVE order matters = (n−1)!. (1 for n ≤ 1.) */
declare function circularPermutations(n: number): number;
/** Combinations WITH repetition ("n multichoose k"): choose k from n types,
 *  repetition allowed, order irrelevant = C(n+k−1, k). Same stars-and-bars
 *  family as {@link starsAndBars}, re-parameterized for selection (e.g. k scoops
 *  from n ice-cream flavours). */
declare function multichoose(n: number, k: number): number;
declare const combinationsWithRepetition: typeof multichoose;
declare function gcd(a: number, b: number): number;
declare function lcm(a: number, b: number): number;
//#endregion
export { binomial, circularPermutations, combinationsWithRepetition, factorial, gcd, lcm, multichoose, multinomial, nCr, nPr, permutationsWithRepetition, ruleOfProduct, ruleOfSum, starsAndBars };