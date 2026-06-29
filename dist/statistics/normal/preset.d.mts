import { ReactNode } from "react";

//#region src/statistics/normal/preset.d.ts
type NormalMode = 'area' | 'rule';
interface NormalProps {
  mu?: number;
  sigma?: number;
  a?: number;
  b?: number;
  mode?: NormalMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function NormalDistributionLab({
  mu,
  sigma,
  a,
  b,
  mode: mode0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: NormalProps): ReactNode;
//#endregion
export { NormalDistributionLab, NormalMode, NormalProps };