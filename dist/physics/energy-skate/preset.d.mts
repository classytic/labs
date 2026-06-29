import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/energy-skate/preset.d.ts
interface EnergySkateProps {
  startHeight?: number;
  friction?: boolean;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['friction'] }` to pin friction off (or on). */
  controlConfig?: ControlConfig;
}
declare function EnergySkateLab({
  startHeight,
  friction,
  mass,
  title,
  prompt,
  objectives,
  controlConfig
}: EnergySkateProps): ReactNode;
//#endregion
export { EnergySkateLab, EnergySkateProps };