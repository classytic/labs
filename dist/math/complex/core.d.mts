declare namespace core_d_exports {
  export { Complex, DEG2RAD, I, MAX_POW, MAX_ROOTS, ONE, RAD2DEG, TWO_PI, ZERO, abs, add, arg, argDeg, conj, cx, div, eq, fromPolar, iPow, isFiniteC, mul, neg, nthRoots, omega, powInt, rootsOfUnity, scale, sub, toPolar, toStr, toTex };
}
/**
 * Complex-number kernel, the pure engine every complex/Argand/polar lab computes
 * against (so a lab — or an agent — never hand-rolls a²+b² or atan2). A complex
 * number is rectangular `{ re, im }`; the polar view (modulus r, argument θ) is
 * derived, exactly the (x, y) ↔ (r, θ) bridge the vector labs already teach.
 *
 * Engineered for CORRECTNESS + SAFETY (no NaN spirals, no overflow, no runaway
 * loops):
 *   • modulus uses Math.hypot (no re²+im² overflow);
 *   • division uses Smith's algorithm (scale by the larger term, avoids overflow
 *     / underflow), with a near-zero-denominator guard;
 *   • integer powers use exponentiation-by-squaring, |n| capped (MAX_POW), with a
 *     finiteness guard so r^n that overflows returns an explicit ∞, not garbage;
 *   • iⁿ is computed EXACTLY from n mod 4 (no float drift in the i, −1, −i, 1 cycle);
 *   • rootsOfUnity / nthRoots cap n (MAX_ROOTS) so an author can't request a
 *     billion-element array.
 */
interface Complex {
  re: number;
  im: number;
}
declare const TWO_PI: number;
declare const RAD2DEG: number;
declare const DEG2RAD: number;
/** Hard caps so an authored value can never blow memory or hang a loop. */
declare const MAX_POW = 1024;
declare const MAX_ROOTS = 360;
declare const cx: (re: number, im?: number) => Complex;
declare const ZERO: Complex;
declare const ONE: Complex;
declare const I: Complex;
declare const isFiniteC: (z: Complex) => boolean;
declare const add: (a: Complex, b: Complex) => Complex;
declare const sub: (a: Complex, b: Complex) => Complex;
declare const neg: (a: Complex) => Complex;
declare const conj: (a: Complex) => Complex;
declare const scale: (a: Complex, k: number) => Complex;
/** (a+bi)(c+di) = (ac − bd) + (ad + bc)i. */
declare const mul: (a: Complex, b: Complex) => Complex;
/**
 * Complex division via Smith's algorithm: divide through by the LARGER of the
 * denominator's components so the intermediate ratio stays in [−1, 1] (no
 * overflow when |b| is huge, no underflow when tiny). Returns an ∞/NaN complex
 * for a (near-)zero denominator rather than throwing.
 */
declare function div(a: Complex, b: Complex): Complex;
/** Modulus |z| = √(re² + im²), via hypot so large components don't overflow. */
declare const abs: (z: Complex) => number;
/** Argument arg(z) in RADIANS, in (−π, π]. arg(0) = 0 by convention. */
declare const arg: (z: Complex) => number;
/** Argument in DEGREES, in (−180, 180]. */
declare const argDeg: (z: Complex) => number;
/** Polar → rectangular: r·e^{iθ} = r(cosθ + i sinθ), θ in radians. */
declare const fromPolar: (r: number, theta: number) => Complex;
/** Rectangular → polar { r, theta(rad) }. */
declare const toPolar: (z: Complex) => {
  r: number;
  theta: number;
};
/**
 * iⁿ for any integer n, EXACTLY (no De Moivre float drift): the 4-cycle
 * 1, i, −1, −i. Negative n handled by the (n mod 4 + 4) mod 4 normalisation.
 */
declare function iPow(n: number): Complex;
/**
 * zⁿ for an INTEGER n via exponentiation-by-squaring (negative n inverts).
 * |n| is capped at MAX_POW; an overflowing magnitude returns an explicit ∞
 * complex (finite check) instead of looping into garbage.
 */
declare function powInt(z: Complex, n: number): Complex;
/**
 * The n nth-roots of UNITY: e^{2πik/n}, k = 0…n−1 (so ω = roots[1] is the
 * primitive root). For n = 2 → {1, −1}; n = 3 → {1, ω, ω²}; n = 4 → {1, i, −1, −i}.
 * n is clamped to [1, MAX_ROOTS]. The k = n/2 (real −1) and k = 0 (real 1) entries
 * are snapped to exact values so labels read cleanly.
 */
declare function rootsOfUnity(n: number): Complex[];
/** The n nth-roots of any z: |z|^{1/n} · e^{i(arg z + 2πk)/n}, k = 0…n−1. */
declare function nthRoots(z: Complex, n: number): Complex[];
/** The primitive nth root of unity ω (default the CUBE root, n = 3): e^{2πi/n}.
 *  For n = 3: ω = −½ + (√3/2)i, with ω³ = 1 and 1 + ω + ω² = 0. */
declare const omega: (n?: number) => Complex;
/** Equal within a tolerance (default 1e-9), on both components. */
declare const eq: (a: Complex, b: Complex, eps?: number) => boolean;
/** Plain string, e.g. "3 − 2i", "i", "−1", "0", "2i". */
declare function toStr(z: Complex, dp?: number): string;
/** LaTeX form for <Tex> (uses real minus signs, "i"). */
declare function toTex(z: Complex, dp?: number): string;
//#endregion
export { Complex, core_d_exports };