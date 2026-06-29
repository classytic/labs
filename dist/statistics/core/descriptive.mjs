//#region src/statistics/core/descriptive.ts
/**
* Descriptive statistics, the pure kernel the statistics labs trust as the
* source of truth (centre, spread, position). No dependencies; every lab POINTS
* to these numbers rather than recomputing them, so the figure and the readout
* can never disagree. Median uses the standard average-of-middle-two for even n;
* variance/σ default to the POPULATION form (divide by n) with a `sample` flag
* for the n−1 (Bessel) form.
*/
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => xs.length ? sum(xs) / xs.length : 0;
function median(xs) {
	if (!xs.length) return 0;
	const s = [...xs].sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Every value tied for the highest frequency (multimodal-aware), sorted. */
function mode(xs) {
	if (!xs.length) return [];
	const freq = /* @__PURE__ */ new Map();
	for (const x of xs) freq.set(x, (freq.get(x) ?? 0) + 1);
	const max = Math.max(...freq.values());
	if (max === 1) return [];
	return [...freq.entries()].filter(([, c]) => c === max).map(([v]) => v).sort((a, b) => a - b);
}
const range = (xs) => xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
function variance(xs, sample = false) {
	if (xs.length < (sample ? 2 : 1)) return 0;
	const m = mean(xs);
	return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - (sample ? 1 : 0));
}
const stddev = (xs, sample = false) => Math.sqrt(variance(xs, sample));
/** Linear-interpolated quantile (q in [0,1]), the inclusive "p = (n−1)q" method. */
function quantile(xs, q) {
	if (!xs.length) return 0;
	const s = [...xs].sort((a, b) => a - b);
	const pos = (s.length - 1) * q;
	const lo = Math.floor(pos), hi = Math.ceil(pos);
	return lo === hi ? s[lo] : s[lo] + (pos - lo) * (s[hi] - s[lo]);
}
function fiveNumber(xs) {
	const q1 = quantile(xs, .25), q3 = quantile(xs, .75);
	return {
		min: xs.length ? Math.min(...xs) : 0,
		q1,
		median: median(xs),
		q3,
		max: xs.length ? Math.max(...xs) : 0,
		iqr: q3 - q1
	};
}
/** Counts per value (for histograms / mode bars), sorted by value. */
function frequencies(xs) {
	const f = /* @__PURE__ */ new Map();
	for (const x of xs) f.set(x, (f.get(x) ?? 0) + 1);
	return [...f.entries()].map(([value, count]) => ({
		value,
		count
	})).sort((a, b) => a.value - b.value);
}

//#endregion
export { fiveNumber, frequencies, mean, median, mode, quantile, range, stddev, sum, variance };