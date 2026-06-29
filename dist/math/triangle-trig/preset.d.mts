import { ProblemAsk } from "../interactive/preset.mjs";
import { ReactNode } from "react";

//#region src/math/triangle-trig/preset.d.ts
interface TriangleTrigProps {
  /** Angle θ in degrees (0 < θ < 90). */
  angleDeg?: number;
  /** Length of the GIVEN leg. */
  leg?: number;
  /** Which leg `leg` is: the vertical 'opposite' or the horizontal 'adjacent'. */
  legKind?: 'opposite' | 'adjacent';
  /** Framing: elevation (look up from the base) / depression (look down from the top) / plain. */
  mode?: 'elevation' | 'depression' | 'plain';
  labels?: {
    opposite?: string;
    adjacent?: string;
    hypotenuse?: string;
    angle?: string;
  };
  /** Which knobs are draggable. Empty → a fixed (authored) scenario. Default: ['angle']. */
  drive?: ('angle' | 'leg')[];
  legMin?: number;
  legMax?: number;
  /** Optional graded question; the answer is checked symbolically/numerically. */
  ask?: ProblemAsk;
  title?: string;
  prompt?: string;
  height?: number;
  activity?: string;
}
declare function TriangleTrig({
  angleDeg,
  leg,
  legKind,
  mode,
  labels,
  drive,
  legMin,
  legMax,
  ask,
  title,
  prompt,
  height,
  activity
}?: TriangleTrigProps): ReactNode;
//#endregion
export { TriangleTrig, TriangleTrigProps };