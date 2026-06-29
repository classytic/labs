import { ReactNode } from "react";

//#region src/math/poly/preset.d.ts
type SolverMode = 'factor' | 'solve';
interface PolynomialSolverProps {
  /** The polynomial in x, e.g. "x^2 + 5x + 6" or "x^3 - 6x^2 + 11x - 6". */
  expr?: string;
  mode?: SolverMode;
  /** Let the learner edit the polynomial (the live solver). Default true. */
  editable?: boolean;
  height?: number;
  title?: string;
  prompt?: string;
}
declare function PolynomialSolverLab({
  expr,
  mode,
  editable,
  title,
  prompt
}?: PolynomialSolverProps): ReactNode;
//#endregion
export { PolynomialSolverLab, PolynomialSolverProps, SolverMode };