//#region src/discrete/core/combinatorics.ts
/**
* Combinatorics kernel, the counting source-of-truth every discrete-math lab
* trusts (so an agent narrates these, never computes its own). Pure, integer,
* dependency-free. The headline identity the Counting lab is built on:
*   nCr(n,k) = nPr(n,k) / k!   ("overcount by order, then divide it out").
*/
const isCount = (n) => Number.isInteger(n) && n >= 0;
function factorial(n) {
	if (!isCount(n)) return NaN;
	let r = 1;
	for (let i = 2; i <= n; i++) r *= i;
	return r;
}
/** Ordered selections: n·(n−1)···(n−r+1). */
function nPr(n, r) {
	if (!isCount(n) || !isCount(r) || r > n) return r > n ? 0 : NaN;
	let r0 = 1;
	for (let i = 0; i < r; i++) r0 *= n - i;
	return r0;
}
/** Unordered selections: nPr/k!, via the exact step-wise multiplicative form. */
function nCr(n, r) {
	if (!isCount(n) || !isCount(r)) return NaN;
	if (r > n) return 0;
	const k = Math.min(r, n - r);
	let res = 1;
	for (let i = 1; i <= k; i++) res = res * (n - k + i) / i;
	return Math.round(res);
}
/** Binomial coefficient, alias of nCr (the "n choose k"). */
const binomial = nCr;
/** Arrangements of a multiset: n! / (k1! k2! …), where Σki = n. */
function multinomial(...counts) {
	let res = factorial(counts.reduce((s, c) => s + c, 0));
	for (const c of counts) res /= factorial(c);
	return Math.round(res);
}
/** Stars and bars: ways to place n identical items into k distinct bins =
*  C(n+k−1, k−1). */
function starsAndBars(n, k) {
	if (!isCount(n) || !isCount(k) || k < 1) return NaN;
	return nCr(n + k - 1, k - 1);
}
/** Rule of PRODUCT (multiplication principle): a task done as a SEQUENCE of
*  independent stages — do stage 1 AND stage 2 AND … — multiplies the choice
*  counts. ruleOfProduct(4, 3, 2) = 24. The spine under nPr / nʳ / factorial. */
function ruleOfProduct(...stages) {
	if (!stages.length || stages.some((c) => !Number.isFinite(c))) return NaN;
	return stages.reduce((p, c) => p * c, 1);
}
/** Rule of SUM (addition principle): MUTUALLY EXCLUSIVE cases — do this OR that,
*  with no overlap — add their counts. ruleOfSum(3, 5) = 8. If the cases can
*  overlap, use {@link inclusionExclusion} (sum, then subtract the double-count). */
function ruleOfSum(...cases) {
	if (!cases.length || cases.some((c) => !Number.isFinite(c))) return NaN;
	return cases.reduce((s, c) => s + c, 0);
}
/** Permutations WITH repetition: r positions, each independently filled from n
*  options = nʳ. PIN codes, license plates, binary strings, functions A→B. */
function permutationsWithRepetition(n, r) {
	if (!isCount(n) || !isCount(r)) return NaN;
	return n ** r;
}
/** Circular permutations: distinct arrangements of n around a round table where
*  only RELATIVE order matters = (n−1)!. (1 for n ≤ 1.) */
function circularPermutations(n) {
	if (!isCount(n)) return NaN;
	return n <= 1 ? 1 : factorial(n - 1);
}
/** Combinations WITH repetition ("n multichoose k"): choose k from n types,
*  repetition allowed, order irrelevant = C(n+k−1, k). Same stars-and-bars
*  family as {@link starsAndBars}, re-parameterized for selection (e.g. k scoops
*  from n ice-cream flavours). */
function multichoose(n, k) {
	if (!isCount(n) || !isCount(k)) return NaN;
	return nCr(n + k - 1, k);
}
const combinationsWithRepetition = multichoose;
function gcd(a, b) {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) [a, b] = [b, a % b];
	return a;
}
function lcm(a, b) {
	if (a === 0 || b === 0) return 0;
	return Math.abs(a / gcd(a, b) * b);
}

//#endregion
export { binomial, circularPermutations, combinationsWithRepetition, factorial, gcd, lcm, multichoose, multinomial, nCr, nPr, permutationsWithRepetition, ruleOfProduct, ruleOfSum, starsAndBars };