import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/math/linear-model/preset.d.ts
interface LinearModelProps {
  /** Hidden rule: y = slope·x + intercept. */
  slope?: number;
  intercept?: number;
  /** Inputs already shown as data points (e.g. [0, 1]). */
  given?: number[];
  /** The input the learner predicts (e.g. 2). */
  predictX?: number;
  xMax?: number;
  yMax?: number;
  xStep?: number;
  yStep?: number;
  /** How close (in y units) counts as correct. Default ½ a y-step. */
  tolerance?: number;
  xLabel?: string;
  yLabel?: string;
  unit?: string;
  /** The concrete twin beside the graph: 'none', 'vessel' (supports objects), or any
   *  registered level scene ('tank' | 'bar' | 'battery' | 'jar' | 'pie' | 'balloon' |
   *  'thermometer' | …). Author picks the skin; new scenes come from registerScene. */
  scene?: string;
  /** Extra concrete twins shown alongside `scene` (multi-representation): the same
   *  quantity as a balloon AND a battery AND the graph, all live-linked. */
  extraScenes?: string[];
  /** Drop discrete objects (marbles) into the vessel = the input count. Off → just liquid. */
  vesselObjects?: boolean;
  /**
   * What the concrete twin's LEVEL tracks:
   *   'guess' (default) the liquid rises/falls live as you drag the point, so the
   *           quantity is something you feel increase and decrease; it turns green
   *           when your reading is right.
   *   'truth' the twin sits at the real measured level (poured on load) and your
   *           reading is a dashed line you match to it ("the real lab result").
   */
  vesselBinds?: 'guess' | 'truth';
  /** Word for one object/scene caption (default: the x label). */
  objectLabel?: string;
  liquidColor?: string;
  objectColor?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
  /** Optional graded follow-up (typed or multiple choice). */
  ask?: LabAskSpec;
}
declare function LinearModelLab(props?: LinearModelProps): ReactNode;
//#endregion
export { LinearModelLab, LinearModelProps };