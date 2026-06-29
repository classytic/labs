import { Worked } from "../../kit/calc.mjs";
import { Poly } from "./core.mjs";

//#region src/math/poly/steps.d.ts
/** Step-by-step FACTORISATION of a polynomial. */
declare function factorSteps(p0: Poly, x?: string): Worked;
/** Step-by-step SOLUTION of p = 0 (factor, then each factor = 0 → the roots). */
declare function solveSteps(p0: Poly, x?: string): Worked;
//#endregion
export { factorSteps, solveSteps };