//#region src/statistics/core/sequences.ts
/** The nth term (1-indexed): aₙ = a₁+(n−1)d  |  aₙ = a₁·r^(n−1). */
function nthTerm(spec, n) {
	return spec.kind === "arithmetic" ? spec.first + (n - 1) * spec.step : spec.first * spec.step ** (n - 1);
}
/** The first `count` terms (1-indexed). */
function terms(spec, count) {
	return Array.from({ length: Math.max(0, count) }, (_, i) => nthTerm(spec, i + 1));
}
/** Partial sum of the first n terms, closed form.
*  arithmetic: n/2·(2a₁+(n−1)d).  geometric: a₁·(1−rⁿ)/(1−r)  (n·a₁ when r=1). */
function partialSum(spec, n) {
	if (n <= 0) return 0;
	if (spec.kind === "arithmetic") return n / 2 * (2 * spec.first + (n - 1) * spec.step);
	const r = spec.step;
	return r === 1 ? n * spec.first : spec.first * (1 - r ** n) / (1 - r);
}
/** Running partial sums S₁…S_count (for the convergence/area visual). */
function partialSums(spec, count) {
	const out = [];
	let acc = 0;
	for (let i = 1; i <= count; i++) {
		acc += nthTerm(spec, i);
		out.push(acc);
	}
	return out;
}
/** Sum to infinity of a geometric series, or null if it diverges (|r| ≥ 1). */
function infiniteSum(spec) {
	if (spec.kind !== "geometric") return null;
	return Math.abs(spec.step) < 1 ? spec.first / (1 - spec.step) : null;
}

//#endregion
export { infiniteSum, nthTerm, partialSum, partialSums, terms };