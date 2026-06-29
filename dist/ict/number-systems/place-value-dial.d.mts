import { ReactNode } from "react";

//#region src/ict/number-systems/place-value-dial.d.ts
interface PlaceValueDialProps {
  base?: number;
  width?: number;
  start?: number;
  /** Pose "spin the dials to N", reports via the learner seam when matched. */
  target?: number;
  /** Base chips the learner can switch between (re-bases the same value). */
  bases?: number[];
  showWeights?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function PlaceValueDialLab({
  base: base0,
  width,
  start,
  target,
  bases,
  showWeights,
  title,
  prompt,
  objectives
}: PlaceValueDialProps): ReactNode;
//#endregion
export { PlaceValueDialLab, PlaceValueDialProps };