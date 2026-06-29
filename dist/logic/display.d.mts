import { ReactNode } from "react";

//#region src/logic/display.d.ts
interface BinaryDisplayProps {
  /** number of bits (2–4 → one hex digit). */
  bits?: number;
  /** starting value. */
  start?: number;
  /** a goal digit the learner must build; met → checkpoint. */
  target?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function BinaryDisplayLab({
  bits,
  start,
  target,
  title,
  prompt,
  activity
}?: BinaryDisplayProps): ReactNode;
//#endregion
export { BinaryDisplayLab, BinaryDisplayProps };