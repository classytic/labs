import { ReactNode } from "react";

//#region src/physics/efficiency/preset.d.ts
interface EffStream {
  label: string;
  /** Share of the input (any positive units; normalised). */
  share: number;
  kind: 'useful' | 'waste';
  color?: string;
}
interface EfficiencyProps {
  /** Built-in device preset (ignored if `streams` is given). */
  device?: 'incandescent' | 'led' | 'petrol-engine' | 'electric-motor' | 'power-station' | 'human';
  deviceName?: string;
  /** Energy supplied, J (default 100, so shares read as percentages). */
  inputJoules?: number;
  /** Author your own breakdown, overrides the preset entirely. */
  streams?: EffStream[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function EfficiencyLab({
  device: device0,
  deviceName,
  inputJoules,
  streams: streamsProp,
  title,
  prompt,
  objectives
}?: EfficiencyProps): ReactNode;
//#endregion
export { EffStream, EfficiencyLab, EfficiencyProps };