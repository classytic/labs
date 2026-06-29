//#region src/core/rng.ts
/** A PRNG returning [0,1). Same seed → same sequence. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
/** Integer in [lo, hi] inclusive. */
function randInt(rng, lo, hi) {
	return lo + Math.floor(rng() * (hi - lo + 1));
}
/** Fisher–Yates shuffle (new array; does not mutate input). */
function shuffle(arr, rng) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
/** Sample `k` distinct items (without replacement). */
function sample(arr, k, rng) {
	return shuffle(arr, rng).slice(0, Math.max(0, Math.min(k, arr.length)));
}
/** A normal (Gaussian) variate via Box–Muller, for sampling-distribution sims. */
function gaussian(rng, mu = 0, sigma = 1) {
	let u = 0, v = 0;
	while (u === 0) u = rng();
	while (v === 0) v = rng();
	return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

//#endregion
export { gaussian, mulberry32, randInt, sample, shuffle };