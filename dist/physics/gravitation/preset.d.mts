import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/gravitation/preset.d.ts
interface GravitationProps {
  /** Planet mass (relative units). */
  planetMass?: number;
  satMass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['planet mass M'] }`. */
  controlConfig?: ControlConfig;
}
declare function GravitationLab({
  planetMass,
  satMass,
  title,
  prompt,
  objectives,
  controlConfig
}: GravitationProps): ReactNode;
//#endregion
export { GravitationLab, GravitationProps };