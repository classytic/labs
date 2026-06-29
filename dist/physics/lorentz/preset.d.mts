import { ReactNode } from "react";

//#region src/physics/lorentz/preset.d.ts
interface LorentzProps {
  charge?: 1 | -1;
  fieldOut?: boolean;
  B?: number;
  speed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function LorentzForceLab({
  charge,
  fieldOut,
  B: B0,
  speed: v0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: LorentzProps): ReactNode;
//#endregion
export { LorentzForceLab, LorentzProps };