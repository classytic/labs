import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/impulse/preset.d.ts
interface ImpulseProps {
  mass?: number;
  speed?: number;
  /** Contact time in seconds (soft = long). */
  contact?: number;
  /** Peak force the fragile target survives (N). */
  crackForce?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['mass','speed'] }` to fix the impulse. */
  controlConfig?: ControlConfig;
}
declare function ImpulseLab({
  mass,
  speed,
  contact,
  crackForce,
  title,
  prompt,
  objectives,
  controlConfig
}: ImpulseProps): ReactNode;
//#endregion
export { ImpulseLab, ImpulseProps };