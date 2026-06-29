//#region src/core/numeric.ts
/** Numerical derivative via the symmetric difference quotient. */
function derivativeAt(fn, x, h = 1e-5) {
	return (fn(x + h) - fn(x - h)) / (2 * h);
}
/** Slope of the secant line through (a, f(a)) and (b, f(b)). */
function secantSlope(fn, a, b) {
	return (fn(b) - fn(a)) / (b - a);
}
/** Sample a function across a range into `{x, y}` points (skips non-finite y is the caller's job). */
function sampleFunction(fn, range, samples = 200) {
	const [min, max] = range;
	const out = [];
	for (let i = 0; i <= samples; i++) {
		const x = min + (max - min) * i / samples;
		out.push({
			x,
			y: fn(x)
		});
	}
	return out;
}
/** Riemann sum of `fn` over `[a, b]` with `n` subintervals. A teaching estimate. */
function riemannSum(fn, range, n, mode = "mid") {
	const [a, b] = range;
	const dx = (b - a) / n;
	let sum = 0;
	for (let i = 0; i < n; i++) {
		const x = mode === "left" ? a + i * dx : mode === "right" ? a + (i + 1) * dx : a + (i + .5) * dx;
		sum += fn(x);
	}
	return sum * dx;
}
/**
* Composite Simpson's rule, a high-accuracy definite-integral estimate (error
* O(h⁴), vs O(h) for a Riemann sum). Used as the "reference" a Riemann sum
* converges toward. `n` is forced even. Not exact, but accurate to ~machine
* precision for smooth integrands at n≈1000.
*/
function integrate(fn, range, n = 1e3) {
	const [a, b] = range;
	const m = Math.max(2, Math.ceil(n / 2) * 2);
	const h = (b - a) / m;
	let sum = fn(a) + fn(b);
	for (let i = 1; i < m; i++) sum += (i % 2 === 1 ? 4 : 2) * fn(a + i * h);
	return sum * h / 3;
}
/**
* Estimate a one-sided limit of `fn` as x → c from `side` (+1 right, −1 left) by
* sampling a shrinking sequence of offsets. Returns the closest-in value and
* whether the sequence is *converging* (consecutive samples agree), so callers
* can honestly report "estimated limit" + confidence rather than a hard claim.
*/
function estimateOneSidedLimit(fn, c, side) {
	const vals = [
		.1,
		.01,
		.001,
		1e-4,
		1e-5
	].map((h) => fn(c + side * h)).filter((v) => Number.isFinite(v));
	if (vals.length < 2) return {
		value: NaN,
		converging: false
	};
	const last = vals[vals.length - 1];
	const prev = vals[vals.length - 2];
	return {
		value: last,
		converging: Math.abs(last - prev) < .01 * (1 + Math.abs(last))
	};
}

//#endregion
export { derivativeAt, estimateOneSidedLimit, integrate, riemannSum, sampleFunction, secantSlope };