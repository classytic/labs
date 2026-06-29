import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

//#region src/core/util.ts
/** Tailwind-aware class merge (clsx + tailwind-merge). */
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
/** Coerce an unknown (e.g. an MDX string attribute) to a finite number, or a fallback. */
function num(v, fallback) {
	const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
	return Number.isFinite(n) ? n : fallback;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
/** Round to `dp` decimal places (default 2), as a number. The shared rounding
*  the part-whole bar labs (percent / fraction / ratio) all need for readouts. */
const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
/** Greatest common divisor (Euclid), 0→1 so a ratio/fraction can always reduce. */
const gcd = (a, b) => {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) [a, b] = [b, a % b];
	return a || 1;
};
const DEG = Math.PI / 180;
/** Degrees → radians. */
const toRad = (deg) => deg * DEG;
/** Radians → degrees. */
const toDeg = (rad) => rad / DEG;
/** Are two numbers equal within a tolerance (default 1e-6)? */
const approxEq = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
/** Map x from [inMin,inMax] to [outMin,outMax], optionally clamped. */
function remap(x, inMin, inMax, outMin, outMax, doClamp = false) {
	const t = inMax === inMin ? 0 : (x - inMin) / (inMax - inMin);
	const v = outMin + (outMax - outMin) * t;
	return doClamp ? clamp(v, Math.min(outMin, outMax), Math.max(outMin, outMax)) : v;
}

//#endregion
export { approxEq, clamp, cn, gcd, lerp, num, remap, round, toDeg, toRad };