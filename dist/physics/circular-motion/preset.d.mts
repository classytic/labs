import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/circular-motion/preset.d.ts
interface CircularMotionProps {
  speed?: number;
  radius?: number;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['radius'] }`. */
  controlConfig?: ControlConfig;
}
declare function CircularMotionLab({
  speed,
  radius,
  mass,
  title,
  prompt,
  objectives,
  controlConfig
}: CircularMotionProps): ReactNode;
//#endregion
export { CircularMotionLab, CircularMotionProps };