import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/diode/preset.d.ts
interface DiodeProps {
  volts?: number;
  resistanceK?: number;
  /** which panels to show: the schematic, the I-V graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function DiodeLab({
  volts,
  resistanceK,
  show,
  title,
  prompt,
  ask,
  activity
}?: DiodeProps): ReactNode;
//#endregion
export { DiodeLab, DiodeProps };