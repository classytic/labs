import { ReactNode } from "react";

//#region src/math/trig/preset.d.ts
interface TrigSignsProps {
  startDeg?: number;
  /** Snap the dragged angle to this step in degrees. Default 15 (hits 30/45/60/90). */
  snapDeg?: number;
  /** Land the angle here for a checkpoint (e.g. 150). */
  targetDeg?: number;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function TrigSignsLab({
  startDeg,
  snapDeg,
  targetDeg,
  height,
  title,
  prompt,
  activity
}?: TrigSignsProps): ReactNode;
//#endregion
export { TrigSignsLab, TrigSignsProps };