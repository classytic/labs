import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";

//#region src/math/complex/core.ts
var core_exports = /* @__PURE__ */ __exportAll({
	DEG2RAD: () => DEG2RAD,
	I: () => I,
	MAX_POW: () => MAX_POW,
	MAX_ROOTS: () => 360,
	ONE: () => ONE,
	RAD2DEG: () => RAD2DEG,
	TWO_PI: () => TWO_PI,
	ZERO: () => ZERO,
	abs: () => abs,
	add: () => add,
	arg: () => arg,
	argDeg: () => argDeg,
	conj: () => conj,
	cx: () => cx,
	div: () => div,
	eq: () => eq,
	fromPolar: () => fromPolar,
	iPow: () => iPow,
	isFiniteC: () => isFiniteC,
	mul: () => mul,
	neg: () => neg,
	nthRoots: () => nthRoots,
	omega: () => omega,
	powInt: () => powInt,
	rootsOfUnity: () => rootsOfUnity,
	scale: () => scale,
	sub: () => sub,
	toPolar: () => toPolar,
	toStr: () => toStr,
	toTex: () => toTex
});
const TWO_PI = Math.PI * 2;
const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
/** Hard caps so an authored value can never blow memory or hang a loop. */
const MAX_POW = 1024;
const MAX_ROOTS = 360;
const cx = (re, im = 0) => ({
	re,
	im
});
const ZERO = {
	re: 0,
	im: 0
};
const ONE = {
	re: 1,
	im: 0
};
const I = {
	re: 0,
	im: 1
};
const isFiniteC = (z) => Number.isFinite(z.re) && Number.isFinite(z.im);
const add = (a, b) => ({
	re: a.re + b.re,
	im: a.im + b.im
});
const sub = (a, b) => ({
	re: a.re - b.re,
	im: a.im - b.im
});
const neg = (a) => ({
	re: -a.re,
	im: -a.im
});
const conj = (a) => ({
	re: a.re,
	im: -a.im
});
const scale = (a, k) => ({
	re: a.re * k,
	im: a.im * k
});
/** (a+bi)(c+di) = (ac − bd) + (ad + bc)i. */
const mul = (a, b) => ({
	re: a.re * b.re - a.im * b.im,
	im: a.re * b.im + a.im * b.re
});
/**
* Complex division via Smith's algorithm: divide through by the LARGER of the
* denominator's components so the intermediate ratio stays in [−1, 1] (no
* overflow when |b| is huge, no underflow when tiny). Returns an ∞/NaN complex
* for a (near-)zero denominator rather than throwing.
*/
function div(a, b) {
	const { re: c, im: d } = b;
	if (c === 0 && d === 0) return {
		re: a.re / 0,
		im: a.im / 0
	};
	if (Math.abs(c) >= Math.abs(d)) {
		const r = d / c, den = c + d * r;
		return {
			re: (a.re + a.im * r) / den,
			im: (a.im - a.re * r) / den
		};
	}
	const r = c / d, den = c * r + d;
	return {
		re: (a.re * r + a.im) / den,
		im: (a.im * r - a.re) / den
	};
}
/** Modulus |z| = √(re² + im²), via hypot so large components don't overflow. */
const abs = (z) => Math.hypot(z.re, z.im);
/** Argument arg(z) in RADIANS, in (−π, π]. arg(0) = 0 by convention. */
const arg = (z) => z.re === 0 && z.im === 0 ? 0 : Math.atan2(z.im, z.re);
/** Argument in DEGREES, in (−180, 180]. */
const argDeg = (z) => arg(z) * RAD2DEG;
/** Polar → rectangular: r·e^{iθ} = r(cosθ + i sinθ), θ in radians. */
const fromPolar = (r, theta) => ({
	re: r * Math.cos(theta),
	im: r * Math.sin(theta)
});
/** Rectangular → polar { r, theta(rad) }. */
const toPolar = (z) => ({
	r: abs(z),
	theta: arg(z)
});
/**
* iⁿ for any integer n, EXACTLY (no De Moivre float drift): the 4-cycle
* 1, i, −1, −i. Negative n handled by the (n mod 4 + 4) mod 4 normalisation.
*/
function iPow(n) {
	if (!Number.isInteger(n)) return {
		re: NaN,
		im: NaN
	};
	switch ((n % 4 + 4) % 4) {
		case 0: return {
			re: 1,
			im: 0
		};
		case 1: return {
			re: 0,
			im: 1
		};
		case 2: return {
			re: -1,
			im: 0
		};
		default: return {
			re: 0,
			im: -1
		};
	}
}
/**
* zⁿ for an INTEGER n via exponentiation-by-squaring (negative n inverts).
* |n| is capped at MAX_POW; an overflowing magnitude returns an explicit ∞
* complex (finite check) instead of looping into garbage.
*/
function powInt(z, n) {
	if (!Number.isInteger(n)) return {
		re: NaN,
		im: NaN
	};
	if (Math.abs(n) > 1024) return {
		re: Infinity,
		im: Infinity
	};
	if (n === 0) return { ...ONE };
	let base = n < 0 ? div(ONE, z) : z;
	let e = Math.abs(n);
	let acc = { ...ONE };
	while (e > 0) {
		if (e & 1) acc = mul(acc, base);
		e >>= 1;
		if (e > 0) base = mul(base, base);
		if (!isFiniteC(acc)) return {
			re: Infinity,
			im: Infinity
		};
	}
	return acc;
}
/** Clamp an nth-root count to a safe, sane range [1, MAX_ROOTS]. */
const safeN = (n) => Number.isInteger(n) && n >= 1 ? Math.min(n, 360) : 1;
/**
* The n nth-roots of UNITY: e^{2πik/n}, k = 0…n−1 (so ω = roots[1] is the
* primitive root). For n = 2 → {1, −1}; n = 3 → {1, ω, ω²}; n = 4 → {1, i, −1, −i}.
* n is clamped to [1, MAX_ROOTS]. The k = n/2 (real −1) and k = 0 (real 1) entries
* are snapped to exact values so labels read cleanly.
*/
function rootsOfUnity(n) {
	const m = safeN(n);
	return Array.from({ length: m }, (_, k) => {
		if (k === 0) return {
			re: 1,
			im: 0
		};
		if (m % 2 === 0 && k === m / 2) return {
			re: -1,
			im: 0
		};
		return fromPolar(1, TWO_PI * k / m);
	});
}
/** The n nth-roots of any z: |z|^{1/n} · e^{i(arg z + 2πk)/n}, k = 0…n−1. */
function nthRoots(z, n) {
	const m = safeN(n);
	const { r, theta } = toPolar(z);
	const root = Math.pow(r, 1 / m);
	return Array.from({ length: m }, (_, k) => fromPolar(root, (theta + TWO_PI * k) / m));
}
/** The primitive nth root of unity ω (default the CUBE root, n = 3): e^{2πi/n}.
*  For n = 3: ω = −½ + (√3/2)i, with ω³ = 1 and 1 + ω + ω² = 0. */
const omega = (n = 3) => fromPolar(1, TWO_PI / safeN(n));
/** Equal within a tolerance (default 1e-9), on both components. */
const eq = (a, b, eps = 1e-9) => Math.abs(a.re - b.re) <= eps && Math.abs(a.im - b.im) <= eps;
const numStr = (n, dp) => {
	if (!Number.isFinite(n)) return n > 0 ? "∞" : "−∞";
	const r = Math.round(n * 10 ** dp) / 10 ** dp;
	return Object.is(r, -0) ? "0" : String(r).replace(/^-/, "−");
};
/** Plain string, e.g. "3 − 2i", "i", "−1", "0", "2i". */
function toStr(z, dp = 2) {
	if (!isFiniteC(z)) return "∞";
	const re = Math.round(z.re * 10 ** dp) / 10 ** dp;
	const im = Math.round(z.im * 10 ** dp) / 10 ** dp;
	if (im === 0) return numStr(re, dp);
	const imPart = im === 1 ? "i" : im === -1 ? "−i" : `${numStr(Math.abs(im), dp)}i`;
	if (re === 0) return im < 0 && im !== -1 ? `−${imPart}` : im === -1 ? "−i" : imPart;
	const sign = im < 0 ? "−" : "+";
	const mag = Math.abs(im) === 1 ? "i" : `${numStr(Math.abs(im), dp)}i`;
	return `${numStr(re, dp)} ${sign} ${mag}`;
}
/** LaTeX form for <Tex> (uses real minus signs, "i"). */
function toTex(z, dp = 2) {
	return toStr(z, dp).replace(/−/g, "-");
}

//#endregion
export { I, ONE, ZERO, abs, add, arg, argDeg, core_exports, cx, div, eq, fromPolar, iPow, isFiniteC, mul, powInt, rootsOfUnity, sub, toStr, toTex };