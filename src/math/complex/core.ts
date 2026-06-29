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

export interface Complex {
  re: number;
  im: number;
}

export const TWO_PI = Math.PI * 2;
export const RAD2DEG = 180 / Math.PI;
export const DEG2RAD = Math.PI / 180;

/** Hard caps so an authored value can never blow memory or hang a loop. */
export const MAX_POW = 1024;
export const MAX_ROOTS = 360;

export const cx = (re: number, im = 0): Complex => ({ re, im });
export const ZERO: Complex = { re: 0, im: 0 };
export const ONE: Complex = { re: 1, im: 0 };
export const I: Complex = { re: 0, im: 1 };

export const isFiniteC = (z: Complex): boolean => Number.isFinite(z.re) && Number.isFinite(z.im);

export const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const neg = (a: Complex): Complex => ({ re: -a.re, im: -a.im });
export const conj = (a: Complex): Complex => ({ re: a.re, im: -a.im });
export const scale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });

/** (a+bi)(c+di) = (ac − bd) + (ad + bc)i. */
export const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

/**
 * Complex division via Smith's algorithm: divide through by the LARGER of the
 * denominator's components so the intermediate ratio stays in [−1, 1] (no
 * overflow when |b| is huge, no underflow when tiny). Returns an ∞/NaN complex
 * for a (near-)zero denominator rather than throwing.
 */
export function div(a: Complex, b: Complex): Complex {
  const { re: c, im: d } = b;
  if (c === 0 && d === 0) return { re: a.re / 0, im: a.im / 0 }; // ±∞ / NaN, defined
  if (Math.abs(c) >= Math.abs(d)) {
    const r = d / c, den = c + d * r;
    return { re: (a.re + a.im * r) / den, im: (a.im - a.re * r) / den };
  }
  const r = c / d, den = c * r + d;
  return { re: (a.re * r + a.im) / den, im: (a.im * r - a.re) / den };
}

/** Modulus |z| = √(re² + im²), via hypot so large components don't overflow. */
export const abs = (z: Complex): number => Math.hypot(z.re, z.im);
/** Argument arg(z) in RADIANS, in (−π, π]. arg(0) = 0 by convention. */
export const arg = (z: Complex): number => (z.re === 0 && z.im === 0 ? 0 : Math.atan2(z.im, z.re));
/** Argument in DEGREES, in (−180, 180]. */
export const argDeg = (z: Complex): number => arg(z) * RAD2DEG;

/** Polar → rectangular: r·e^{iθ} = r(cosθ + i sinθ), θ in radians. */
export const fromPolar = (r: number, theta: number): Complex => ({ re: r * Math.cos(theta), im: r * Math.sin(theta) });
/** Rectangular → polar { r, theta(rad) }. */
export const toPolar = (z: Complex): { r: number; theta: number } => ({ r: abs(z), theta: arg(z) });

/**
 * iⁿ for any integer n, EXACTLY (no De Moivre float drift): the 4-cycle
 * 1, i, −1, −i. Negative n handled by the (n mod 4 + 4) mod 4 normalisation.
 */
export function iPow(n: number): Complex {
  if (!Number.isInteger(n)) return { re: NaN, im: NaN };
  switch (((n % 4) + 4) % 4) {
    case 0: return { re: 1, im: 0 };
    case 1: return { re: 0, im: 1 };
    case 2: return { re: -1, im: 0 };
    default: return { re: 0, im: -1 };
  }
}

/**
 * zⁿ for an INTEGER n via exponentiation-by-squaring (negative n inverts).
 * |n| is capped at MAX_POW; an overflowing magnitude returns an explicit ∞
 * complex (finite check) instead of looping into garbage.
 */
export function powInt(z: Complex, n: number): Complex {
  if (!Number.isInteger(n)) return { re: NaN, im: NaN };
  if (Math.abs(n) > MAX_POW) return { re: Infinity, im: Infinity };
  if (n === 0) return { ...ONE };
  let base = n < 0 ? div(ONE, z) : z;
  let e = Math.abs(n);
  let acc: Complex = { ...ONE };
  while (e > 0) {
    if (e & 1) acc = mul(acc, base);
    e >>= 1;
    if (e > 0) base = mul(base, base);
    if (!isFiniteC(acc)) return { re: Infinity, im: Infinity };
  }
  return acc;
}

/** Clamp an nth-root count to a safe, sane range [1, MAX_ROOTS]. */
const safeN = (n: number): number => (Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_ROOTS) : 1);

/**
 * The n nth-roots of UNITY: e^{2πik/n}, k = 0…n−1 (so ω = roots[1] is the
 * primitive root). For n = 2 → {1, −1}; n = 3 → {1, ω, ω²}; n = 4 → {1, i, −1, −i}.
 * n is clamped to [1, MAX_ROOTS]. The k = n/2 (real −1) and k = 0 (real 1) entries
 * are snapped to exact values so labels read cleanly.
 */
export function rootsOfUnity(n: number): Complex[] {
  const m = safeN(n);
  return Array.from({ length: m }, (_, k) => {
    if (k === 0) return { re: 1, im: 0 };
    if (m % 2 === 0 && k === m / 2) return { re: -1, im: 0 };
    return fromPolar(1, (TWO_PI * k) / m);
  });
}

/** The n nth-roots of any z: |z|^{1/n} · e^{i(arg z + 2πk)/n}, k = 0…n−1. */
export function nthRoots(z: Complex, n: number): Complex[] {
  const m = safeN(n);
  const { r, theta } = toPolar(z);
  const root = Math.pow(r, 1 / m);
  return Array.from({ length: m }, (_, k) => fromPolar(root, (theta + TWO_PI * k) / m));
}

/** The primitive nth root of unity ω (default the CUBE root, n = 3): e^{2πi/n}.
 *  For n = 3: ω = −½ + (√3/2)i, with ω³ = 1 and 1 + ω + ω² = 0. */
export const omega = (n = 3): Complex => fromPolar(1, TWO_PI / safeN(n));

/** Equal within a tolerance (default 1e-9), on both components. */
export const eq = (a: Complex, b: Complex, eps = 1e-9): boolean =>
  Math.abs(a.re - b.re) <= eps && Math.abs(a.im - b.im) <= eps;

// ── pretty-printing (clean "a + bi", with the 0 / ±1 / pure cases handled) ──────

const numStr = (n: number, dp: number): string => {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '−∞';
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return Object.is(r, -0) ? '0' : String(r).replace(/^-/, '−'); // unicode minus
};

/** Plain string, e.g. "3 − 2i", "i", "−1", "0", "2i". */
export function toStr(z: Complex, dp = 2): string {
  if (!isFiniteC(z)) return '∞';
  const re = Math.round(z.re * 10 ** dp) / 10 ** dp;
  const im = Math.round(z.im * 10 ** dp) / 10 ** dp;
  if (im === 0) return numStr(re, dp);
  const imPart = im === 1 ? 'i' : im === -1 ? '−i' : `${numStr(Math.abs(im), dp)}i`;
  if (re === 0) return im < 0 && im !== -1 ? `−${imPart}` : im === -1 ? '−i' : imPart;
  const sign = im < 0 ? '−' : '+';
  const mag = Math.abs(im) === 1 ? 'i' : `${numStr(Math.abs(im), dp)}i`;
  return `${numStr(re, dp)} ${sign} ${mag}`;
}

/** LaTeX form for <Tex> (uses real minus signs, "i"). */
export function toTex(z: Complex, dp = 2): string {
  return toStr(z, dp).replace(/−/g, '-');
}
