import { LabAskSpec } from "../kit/ask.mjs";
import { LogicDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/logic/lab.d.ts
interface LogicGateProps {
  doc?: LogicDoc;
  /** a named preset (and/or/xor/nand-not/nand-and/nand-or/half-adder/full-adder). */
  preset?: string;
  mode?: 'explore' | 'predict';
  /** show the step control that lights the signal up level by level. */
  steps?: boolean;
  /** show the full truth table alongside. */
  showTable?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function LogicGateLab({
  doc: doc0,
  preset,
  mode,
  steps,
  showTable,
  title,
  prompt,
  ask,
  activity
}?: LogicGateProps): ReactNode;
//#endregion
export { LogicGateLab, LogicGateProps };