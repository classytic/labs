import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/terminal-velocity/preset.d.ts
interface TerminalVelocityProps {
  mass?: number;
  /** Air-drag factor (streamlining/area), arbitrary units. */
  drag?: number;
  parachute?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['parachute'] }`. */
  controlConfig?: ControlConfig;
}
declare function TerminalVelocityLab({
  mass,
  drag,
  parachute,
  title,
  prompt,
  objectives,
  controlConfig
}: TerminalVelocityProps): ReactNode;
//#endregion
export { TerminalVelocityLab, TerminalVelocityProps };