import { ReactNode } from "react";

//#region src/math/percent-bar/preset.d.ts
interface PercentSegment {
  /** Share of the whole, 0..1 (segments are normalized together). */
  frac: number;
  label?: string;
  color?: string;
}
interface PercentBarProps {
  /** The quantity the full bar represents (100%). Default 100. */
  whole?: number;
  /** Unit on the concrete amount, e.g. "students", "mL", "$". */
  unit?: string;
  /** Starting fill in percent (0..100). Default 0. */
  start?: number;
  /** Goal in percent; solved when the fill lands on it. Omit for free explore. */
  target?: number;
  /** Snap granularity in percent. Default 5. */
  snapPct?: number;
  /** Show the concrete amount (percent × whole) alongside the percent. */
  showValue?: boolean;
  /** Optional authored breakdown drawn on a reference bar above the slider. */
  segments?: PercentSegment[];
  /** Caption for the reference bar (e.g. "The class", "Monthly budget"). */
  referenceLabel?: string;
  /** Optional concrete twin of the percentage: any level scene ('pie' | 'battery' |
   *  'jar' | 'balloon' | …). A percentage shown as a pie filling is the obvious one. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function PercentBarLab(props?: PercentBarProps): ReactNode;
//#endregion
export { PercentBarLab, PercentBarProps, PercentSegment };