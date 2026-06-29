//#region src/discrete/core/probability.ts
/**
* Probability kernel, equally-likely sample spaces, conditioning, Bayes,
* independence, expectation. This is the "truth" the base-rate / Monty labs read
* (the agent narrates these numbers; it never invents them). Conditioning =
* shrink the sample space: P(A|B) = |A∩B| / |B|.
*/
/** Favourable / total over an equally-likely space. */
function probability(favorable, total) {
	return total > 0 ? favorable / total : NaN;
}
function complement(p) {
	return 1 - p;
}
/** P(A|B) = P(A∩B) / P(B), restrict the world to B, then re-count. */
function conditional(pAandB, pB) {
	return pB > 0 ? pAandB / pB : NaN;
}
/**
* P(A|B) from the natural inputs: the true-positive rate P(B|A), the prior P(A),
* and the false-positive rate P(B|¬A). The base-rate-neglect engine.
*/
function bayes(pBgivenA, pA, pBgivenNotA) {
	const num = pBgivenA * pA;
	const den = num + pBgivenNotA * (1 - pA);
	return den > 0 ? num / den : NaN;
}
/** A and B are independent iff P(A∩B) = P(A)·P(B) (within eps). NOT the same as
*  disjoint, disjoint events are maximally DEPENDENT. */
function independent(pA, pB, pAandB, eps = 1e-9) {
	return Math.abs(pAandB - pA * pB) <= eps;
}
/** Expected value Σ p·value (probabilities should sum to 1). */
function expectedValue(outcomes) {
	return outcomes.reduce((s, o) => s + o.p * o.value, 0);
}
/** "At least one" via the complement: 1 − (1−p)^n. */
function atLeastOne(pEach, n) {
	return 1 - Math.pow(1 - pEach, n);
}

//#endregion
export { atLeastOne, bayes, complement, conditional, expectedValue, independent, probability };