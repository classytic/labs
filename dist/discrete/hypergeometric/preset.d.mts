import { ReactNode } from "react";

//#region src/discrete/hypergeometric/preset.d.ts
interface HypergeometricProps {
  N?: number;
  K?: number;
  n?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function HypergeometricLab({
  N: N0,
  K: K0,
  n: n0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: HypergeometricProps): ReactNode;
//#endregion
export { HypergeometricLab, HypergeometricProps };