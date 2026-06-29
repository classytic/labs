//#region src/statistics/core/normal.d.ts
/**
 * Normal-distribution kernel, the bell curve's pdf/cdf, the z-score, and the
 * area between two points (the probability a value lands in a range). The cdf uses
 * the Abramowitz–Stegun erf approximation (max error ~1.5e-7, far tighter than
 * any teaching needs). The labs render these; they never re-derive them.
 */
/** Gauss error function (A&S 7.1.26). */
declare function erf(x: number): number;
/** Normal probability density at x. */
declare function normalPdf(x: number, mu?: number, sigma?: number): number;
/** Cumulative probability P(X ≤ x). */
declare function normalCdf(x: number, mu?: number, sigma?: number): number;
/** P(a ≤ X ≤ b). */
declare function normalBetween(a: number, b: number, mu?: number, sigma?: number): number;
/** The standard score: how many σ a value sits from the mean. */
declare function zScore(x: number, mu?: number, sigma?: number): number;
/** The 68–95–99.7 rule, P(within k·σ of the mean). */
declare function withinSigma(k: number): number;
//#endregion
export { erf, normalBetween, normalCdf, normalPdf, withinSigma, zScore };