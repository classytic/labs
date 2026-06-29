import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/atwood/preset.d.ts
interface AtwoodProps {
  m1?: number;
  m2?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['m₁ (left)'] }`. */
  controlConfig?: ControlConfig;
}
declare function AtwoodLab({
  m1,
  m2,
  title,
  prompt,
  objectives,
  controlConfig
}: AtwoodProps): ReactNode;
//#endregion
export { AtwoodLab, AtwoodProps };