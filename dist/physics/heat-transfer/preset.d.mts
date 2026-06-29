import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/heat-transfer/preset.d.ts
type Mode = 'conduction' | 'convection' | 'radiation';
interface HeatTransferProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /**
   * Creator policy. To author a SINGLE-mechanism lesson (e.g. conduction only),
   * set `mode: 'conduction'` and `controlConfig: { hide: ['mechanism'] }`, the
   * switcher vanishes and the lab is focused on that one idea. Any knob (material,
   * rod length, body temperature, …) can likewise be hidden or locked.
   */
  controlConfig?: ControlConfig;
}
declare function HeatTransferLab({
  mode: mode0,
  title,
  prompt,
  objectives,
  controlConfig
}?: HeatTransferProps): ReactNode;
//#endregion
export { HeatTransferLab, HeatTransferProps };