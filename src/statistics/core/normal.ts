/**
 * Normal-distribution kernel, the bell curve's pdf/cdf, the z-score, and the
 * area between two points (the probability a value lands in a range). The cdf uses
 * the Abramowitz–Stegun erf approximation (max error ~1.5e-7, far tighter than
 * any teaching needs). The labs render these; they never re-derive them.
 */

/** Gauss error function (A&S 7.1.26). */
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** Normal probability density at x. */
export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Cumulative probability P(X ≤ x). */
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

/** P(a ≤ X ≤ b). */
export function normalBetween(a: number, b: number, mu = 0, sigma = 1): number {
  return Math.abs(normalCdf(b, mu, sigma) - normalCdf(a, mu, sigma));
}

/** The standard score: how many σ a value sits from the mean. */
export function zScore(x: number, mu = 0, sigma = 1): number {
  return (x - mu) / sigma;
}

/** The 68–95–99.7 rule, P(within k·σ of the mean). */
export function withinSigma(k: number): number {
  return normalBetween(-k, k, 0, 1);
}
