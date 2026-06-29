import { ReactNode } from "react";

//#region src/discrete/pascal/preset.d.ts
type PascalView = 'build' | 'binomial' | 'parity';
interface PascalProps {
  rows?: number;
  view?: PascalView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function PascalTriangleLab({
  rows,
  view: view0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: PascalProps): ReactNode;
//#endregion
export { PascalProps, PascalTriangleLab, PascalView };