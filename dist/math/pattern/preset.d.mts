import { PATTERN_FIGURE_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/math/pattern/preset.d.ts
interface GrowingPatternProps {
  a?: number;
  b?: number;
  steps?: number;
  prompt?: string;
  check?: 'steppers' | 'mcq';
  choices?: string[];
  controlId?: string;
  height?: number;
}
declare function growingPatternDoc({
  a,
  b,
  steps
}: GrowingPatternProps): SceneDoc;
declare function GrowingPatternLab({
  a,
  b,
  steps,
  prompt,
  check,
  choices,
  controlId,
  height
}: GrowingPatternProps): ReactNode;
//#endregion
export { GrowingPatternLab, GrowingPatternProps, growingPatternDoc };