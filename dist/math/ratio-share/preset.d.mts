import { ReactNode } from "react";

//#region src/math/ratio-share/preset.d.ts
interface RatioShareProps {
  /** Ratio parts a : b. Defaults 2 : 3. */
  a?: number;
  b?: number;
  /** The quantity being shared. Default 100. */
  total?: number;
  unit?: string;
  labelA?: string;
  labelB?: string;
  /** Drag step for the divider, in units of the total. Default 1. */
  step?: number;
  /** Optional concrete twin (any level scene): share A as a pie / jar slice / etc. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function RatioShareLab(props?: RatioShareProps): ReactNode;
//#endregion
export { RatioShareLab, RatioShareProps };