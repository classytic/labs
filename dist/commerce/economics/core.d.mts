//#region src/commerce/economics/core.d.ts
/**
 * The simple linear supply/demand core, single source of truth shared by every
 * economics lab (market equilibrium, shift-vs-move, elasticity). Pure functions,
 * no dependencies.
 *
 * Convention: price P on the vertical axis, quantity Q on the horizontal.
 *   demand  P = a − bQ   (downward)   →  Qd(P) = (a − P) / b
 *   supply  P = a + bQ   (upward)     →  Qs(P) = (P − a) / b
 */
interface Curve {
  /** price-axis intercept (P at Q = 0). */
  intercept: number;
  /** magnitude of the slope (always > 0; demand falls, supply rises). */
  slope: number;
}
declare const demandP: (d: Curve, q: number) => number;
declare const supplyP: (s: Curve, q: number) => number;
declare const demandQ: (d: Curve, p: number) => number;
declare const supplyQ: (s: Curve, p: number) => number;
/** Where Qd = Qs, the market-clearing price + quantity. */
declare function equilibrium(d: Curve, s: Curve): {
  q: number;
  p: number;
};
/**
 * Point price-elasticity of demand at price `p` on a linear demand curve,
 * returned as a magnitude. |E| = (P/Q)·(1/b) since dQ/dP = −1/b. Elastic > 1,
 * unit = 1, inelastic < 1.
 */
declare function pointElasticity(d: Curve, p: number): number;
//#endregion
export { Curve, demandP, demandQ, equilibrium, pointElasticity, supplyP, supplyQ };