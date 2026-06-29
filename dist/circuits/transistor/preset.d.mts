import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/transistor/preset.d.ts
interface TransistorProps {
  supply?: number;
  vth?: number;
  loadK?: number;
  /** which panels to show: the schematic, the transfer graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function TransistorLab({
  supply,
  vth,
  loadK,
  show,
  title,
  prompt,
  ask,
  activity
}?: TransistorProps): ReactNode;
//#endregion
export { TransistorLab, TransistorProps };