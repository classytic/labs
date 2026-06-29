//#region src/statistics/core/descriptive.d.ts
/**
 * Descriptive statistics, the pure kernel the statistics labs trust as the
 * source of truth (centre, spread, position). No dependencies; every lab POINTS
 * to these numbers rather than recomputing them, so the figure and the readout
 * can never disagree. Median uses the standard average-of-middle-two for even n;
 * variance/σ default to the POPULATION form (divide by n) with a `sample` flag
 * for the n−1 (Bessel) form.
 */
declare const sum: (xs: number[]) => number;
declare const mean: (xs: number[]) => number;
declare function median(xs: number[]): number;
/** Every value tied for the highest frequency (multimodal-aware), sorted. */
declare function mode(xs: number[]): number[];
declare const range: (xs: number[]) => number;
declare function variance(xs: number[], sample?: boolean): number;
declare const stddev: (xs: number[], sample?: boolean) => number;
/** Linear-interpolated quantile (q in [0,1]), the inclusive "p = (n−1)q" method. */
declare function quantile(xs: number[], q: number): number;
interface FiveNumber {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
}
declare function fiveNumber(xs: number[]): FiveNumber;
/** Counts per value (for histograms / mode bars), sorted by value. */
declare function frequencies(xs: number[]): {
  value: number;
  count: number;
}[];
//#endregion
export { FiveNumber, fiveNumber, frequencies, mean, median, mode, quantile, range, stddev, sum, variance };