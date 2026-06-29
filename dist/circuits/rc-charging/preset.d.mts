import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/rc-charging/preset.d.ts
interface RCChargingProps {
  volts?: number;
  resistanceK?: number;
  capacitanceU?: number;
  /** which panels to show: the schematic, the V(t) graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function RCChargingLab({
  volts,
  resistanceK,
  capacitanceU,
  show,
  title,
  prompt,
  ask,
  activity
}?: RCChargingProps): ReactNode;
//#endregion
export { RCChargingLab, RCChargingProps };