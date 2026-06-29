import { LogicDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/logic/LogicBuildLab.d.ts
interface LogicBuildProps {
  /** starting canvas. Defaults to a seed derived from the goal, or an empty board. */
  doc?: LogicDoc;
  /** a reference LogicDoc or preset key; when set, the lab grades against its truth table. */
  goal?: LogicDoc | string;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function LogicBuildLab({
  doc: doc0,
  goal,
  title,
  prompt,
  activity
}?: LogicBuildProps): ReactNode;
//#endregion
export { LogicBuildLab, LogicBuildProps };