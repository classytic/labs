//#region src/core/numeric.d.ts
/**
 * numeric, small numerical-calculus helpers, used when an exact symbolic result
 * isn't available (e.g. a function the differentiator doesn't handle) or when a
 * widget just needs a number. Pure, dependency-free.
 */
type RealFn = (x: number) => number;
/** Numerical derivative via the symmetric difference quotient. */
declare function derivativeAt(fn: RealFn, x: number, h?: number): number;
/** Slope of the secant line through (a, f(a)) and (b, f(b)). */
declare function secantSlope(fn: RealFn, a: number, b: number): number;
/** Sample a function across a range into `{x, y}` points (skips non-finite y is the caller's job). */
declare function sampleFunction(fn: RealFn, range: [number, number], samples?: number): {
  x: number;
  y: number;
}[];
/** Riemann sum of `fn` over `[a, b]` with `n` subintervals. A teaching estimate. */
declare function riemannSum(fn: RealFn, range: [number, number], n: number, mode?: 'left' | 'right' | 'mid'): number;
/**
 * Composite Simpson's rule, a high-accuracy definite-integral estimate (error
 * O(h⁴), vs O(h) for a Riemann sum). Used as the "reference" a Riemann sum
 * converges toward. `n` is forced even. Not exact, but accurate to ~machine
 * precision for smooth integrands at n≈1000.
 */
declare function integrate(fn: RealFn, range: [number, number], n?: number): number;
/**
 * Estimate a one-sided limit of `fn` as x → c from `side` (+1 right, −1 left) by
 * sampling a shrinking sequence of offsets. Returns the closest-in value and
 * whether the sequence is *converging* (consecutive samples agree), so callers
 * can honestly report "estimated limit" + confidence rather than a hard claim.
 */
declare function estimateOneSidedLimit(fn: RealFn, c: number, side: 1 | -1): {
  value: number;
  converging: boolean;
};
//#endregion
export { RealFn, derivativeAt, estimateOneSidedLimit, integrate, riemannSum, sampleFunction, secantSlope };