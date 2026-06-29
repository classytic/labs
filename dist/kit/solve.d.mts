import { Complex } from "../math/complex/core.mjs";
import { fromAst } from "../math/poly/core.mjs";
import { Node } from "@classytic/stage";

//#region src/kit/solve.d.ts
/** Coefficients [a0, a1, …] of `node` as a polynomial in `x` (the canonical poly
 *  engine does the extraction). null if it isn't polynomial in x. */
declare const polyCoeffs: typeof fromAst;
interface PolySolution {
  coeffs: number[];
  degree: number;
  roots: Complex[];
  realRoots: number[];
  discriminant?: number;
}
/** Solve `node` = 0 for x exactly (degree 1 or 2). null if not a usable polynomial. */
declare function solvePoly(node: Node, x?: string, params?: Record<string, number>): PolySolution | null;
/** "x = 2 or x = −2" (complex when needed), or "no real solutions" framing. */
declare function solutionTex(sol: PolySolution, x?: string): string;
//#endregion
export { PolySolution, polyCoeffs, solutionTex, solvePoly };