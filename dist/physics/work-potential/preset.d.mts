import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/physics/work-potential/preset.d.ts
interface WorkPotentialProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}
declare function WorkPotentialLab({
  title,
  prompt,
  ask,
  height,
  activity
}?: WorkPotentialProps): ReactNode;
//#endregion
export { WorkPotentialLab, WorkPotentialProps };