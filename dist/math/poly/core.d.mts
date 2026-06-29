import { Complex } from "../complex/core.mjs";
import { Node } from "@classytic/stage";

//#region src/math/poly/core.d.ts
declare namespace core_d_exports {
  export { Poly, PolyRoots, add, allRoots, deflate, degree, deriv, evalC, evalPoly, factorTex, fromAst, mul, polyTex, solve, solveEquation, trim };
}
type Poly = number[];
declare const trim: (p: Poly) => Poly;
declare const degree: (p: Poly) => number;
/** Horner evaluation (real). */
declare function evalPoly(p: Poly, x: number): number;
/** Horner evaluation (complex). */
declare function evalC(p: Poly, z: Complex): Complex;
/** Derivative polynomial. */
declare const deriv: (p: Poly) => Poly;
declare function add(a: Poly, b: Poly): Poly;
declare function mul(a: Poly, b: Poly): Poly;
/** Synthetic division of p by (x − r); returns the quotient (assumes r is a root,
 *  i.e. drops the remainder). The "divide out a found factor" step. */
declare function deflate(p: Poly, r: number): Poly;
/** LaTeX of a polynomial in descending order, e.g. [−6,11,−6,1] → "x^{3} - 6x^{2} + 11x - 6". */
declare function polyTex(p0: Poly, x?: string): string;
/** Coefficients of `node` as a polynomial in `x` (other vars from `params`), or
 *  null if it isn't a polynomial in x (sin(x), 1/x, fractional power, …). */
declare function fromAst(node: Node, x?: string, params?: Record<string, number>): Poly | null;
/**
 * All complex roots of `p` via Durand–Kerner simultaneous iteration (then snapped).
 * For a degree-n polynomial returns n roots; real roots come back with im = 0.
 */
declare function allRoots(p0: Poly): Complex[];
interface PolyRoots {
  poly: Poly;
  degree: number;
  roots: Complex[];
  realRoots: number[];
}
/** Solve p = 0 for ALL roots (any degree up to MAX_DEG). null if degenerate. */
declare function solve(p0: Poly): PolyRoots | null;
/** Solve an expression-AST equation `expr = 0` for x, any degree. null if not a
 *  polynomial in x. (Linear/quadratic also flow through here, exactly.) */
declare function solveEquation(node: Node, x?: string, params?: Record<string, number>): PolyRoots | null;
/**
 * Factored form of the polynomial over the reals: leading coefficient × linear
 * factors (real roots, with multiplicity) × irreducible quadratics (complex
 * conjugate pairs). e.g. x³−6x²+11x−6 → "(x − 1)(x − 2)(x − 3)".
 */
declare function factorTex(p0: Poly, x?: string): string;
//#endregion
export { Poly, PolyRoots, add, allRoots, core_d_exports, deflate, degree, deriv, evalC, evalPoly, factorTex, fromAst, mul, polyTex, solve, solveEquation, trim };