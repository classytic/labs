import { ReactNode } from "react";

//#region src/math/number-line/preset.d.ts
interface NumberLineProps {
  min?: number;
  max?: number;
  start?: number;
  /** If set, the learner must land the marker here (e.g. the solution −3). */
  target?: number;
  title?: string;
  prompt?: string;
  height?: number;
}
declare function NumberLineLab({
  min,
  max,
  start,
  target,
  title,
  prompt,
  height
}?: NumberLineProps): ReactNode;
//#endregion
export { NumberLineLab, NumberLineProps };