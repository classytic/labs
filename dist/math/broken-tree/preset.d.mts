import { ReactNode } from "react";

//#region src/math/broken-tree/preset.d.ts
interface BrokenTreeProps {
  /** The tree's full (un-broken) height. */
  originalHeight?: number;
  /** Ground distance to the house, the goal is to land the top here (omit → free play). */
  target?: number;
  /** Initial break height. */
  breakHeight?: number;
  title?: string;
  prompt?: string;
  height?: number;
  activity?: string;
}
declare function BrokenTreeLab({
  originalHeight,
  target,
  breakHeight,
  title,
  prompt,
  height,
  activity
}?: BrokenTreeProps): ReactNode;
//#endregion
export { BrokenTreeLab, BrokenTreeProps };