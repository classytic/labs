import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/circuits/brownout/preset.d.ts
interface BrownoutProps {
  vth?: number;
  vmax?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function BrownoutLab({
  vth,
  vmax,
  title,
  prompt,
  ask,
  activity
}?: BrownoutProps): ReactNode;
//#endregion
export { BrownoutLab, BrownoutProps };