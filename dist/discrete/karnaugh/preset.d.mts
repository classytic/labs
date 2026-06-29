import { ReactNode } from "react";

//#region src/discrete/karnaugh/preset.d.ts
type KMapMode = 'show' | 'simplify';
interface KMapProps {
  formula?: string;
  minterms?: number[];
  dontCares?: number[];
  vars?: string[];
  mode?: KMapMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function KarnaughMapLab({
  formula,
  minterms: mtIn,
  dontCares: dcIn,
  vars: varsIn,
  mode,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: KMapProps): ReactNode;
//#endregion
export { KMapMode, KMapProps, KarnaughMapLab };