import { ReactNode } from "react";

//#region src/ict/number-systems/base-odometer.d.ts
interface BaseOdometerProps {
  bases?: number[];
  /** digit count per row; 'auto' sizes each base to hold `max`. */
  width?: number | 'auto';
  start?: number;
  max?: number;
  race?: boolean;
  /** ticks per second while racing. */
  speed?: number;
  /** tint one base row as the focus/answer. */
  highlightBase?: number;
  target?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function BaseOdometerLab({
  bases,
  width,
  start,
  max,
  race,
  speed,
  highlightBase,
  target,
  title,
  prompt,
  objectives
}: BaseOdometerProps): ReactNode;
//#endregion
export { BaseOdometerLab, BaseOdometerProps };