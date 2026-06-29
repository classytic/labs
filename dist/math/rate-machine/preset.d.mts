import { ReactNode } from "react";

//#region src/math/rate-machine/preset.d.ts
interface RateMachineProps {
  /** Hidden rule: total = rate·count + base. */
  rate?: number;
  base?: number;
  /** Largest count the learner can dial up to. */
  maxCount?: number;
  /** Where the count starts. */
  startCount?: number;
  yMax?: number;
  yStep?: number;
  xLabel?: string;
  yLabel?: string;
  unit?: string;
  /** Word for one unit of the count (default: singular of xLabel). */
  itemLabel?: string;
  /** The concrete twin skin: 'vessel' (drops objects) or any registered level scene. */
  scene?: string;
  extraScenes?: string[];
  /** Drop discrete objects (marbles) as the count = the input. Default true. */
  showObjects?: boolean;
  liquidColor?: string;
  objectColor?: string;
  /** Optional graded goal: "set it to N". Omit for a free explore. */
  target?: number;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function RateMachineLab(props?: RateMachineProps): ReactNode;
//#endregion
export { RateMachineLab, RateMachineProps };