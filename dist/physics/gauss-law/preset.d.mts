import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/physics/gauss-law/preset.d.ts
interface GaussProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}
declare function GaussLab({
  title,
  prompt,
  ask,
  height,
  activity
}?: GaussProps): ReactNode;
//#endregion
export { GaussLab, GaussProps };