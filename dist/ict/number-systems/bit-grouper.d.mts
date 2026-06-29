import { ReactNode } from "react";

//#region src/ict/number-systems/bit-grouper.d.ts
interface BitGrouperProps {
  width?: number;
  groupSize?: number;
  /** Group sizes offered as chips (4 = hex, 3 = octal). */
  groupings?: number[];
  start?: number;
  /** Pose "build this value", reports via the learner seam when matched. */
  target?: {
    value: number;
    base: 16 | 8 | 2;
  };
  showColor?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function BitGrouperLab({
  width,
  groupSize,
  groupings,
  start,
  target,
  showColor,
  title,
  prompt,
  objectives
}: BitGrouperProps): ReactNode;
//#endregion
export { BitGrouperLab, BitGrouperProps };