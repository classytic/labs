/**
 * The simple linear supply/demand core — single source of truth shared by every
 * economics lab (market equilibrium, shift-vs-move, elasticity). Pure functions,
 * no dependencies.
 *
 * Convention: price P on the vertical axis, quantity Q on the horizontal.
 *   demand  P = a − bQ   (downward)   →  Qd(P) = (a − P) / b
 *   supply  P = a + bQ   (upward)     →  Qs(P) = (P − a) / b
 */

export interface Curve {
  /** price-axis intercept (P at Q = 0). */
  intercept: number;
  /** magnitude of the slope (always > 0; demand falls, supply rises). */
  slope: number;
}

export const demandP = (d: Curve, q: number): number => d.intercept - d.slope * q;
export const supplyP = (s: Curve, q: number): number => s.intercept + s.slope * q;
export const demandQ = (d: Curve, p: number): number => Math.max(0, (d.intercept - p) / d.slope);
export const supplyQ = (s: Curve, p: number): number => Math.max(0, (p - s.intercept) / s.slope);

/** Where Qd = Qs — the market-clearing price + quantity. */
export function equilibrium(d: Curve, s: Curve): { q: number; p: number } {
  const q = (d.intercept - s.intercept) / (d.slope + s.slope);
  return { q, p: s.intercept + s.slope * q };
}

/**
 * Point price-elasticity of demand at price `p` on a linear demand curve,
 * returned as a magnitude. |E| = (P/Q)·(1/b) since dQ/dP = −1/b. Elastic > 1,
 * unit = 1, inelastic < 1.
 */
export function pointElasticity(d: Curve, p: number): number {
  const q = demandQ(d, p);
  if (q <= 1e-9) return Infinity;
  return (p / q) * (1 / d.slope);
}
