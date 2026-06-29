import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/expansion/preset.d.ts
type Mode = 'length' | 'area' | 'volume' | 'bimetallic';
interface ThermalExpansionProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /**
   * Creator policy. For a single-case lesson (e.g. area only) set `mode: 'area'`
   * and `controlConfig: { hide: ['what expands'] }`; lock/hide the material or ΔT
   * the same way.
   */
  controlConfig?: ControlConfig;
}
declare function ThermalExpansionLab({
  mode: mode0,
  title,
  prompt,
  objectives,
  controlConfig
}?: ThermalExpansionProps): ReactNode;
//#endregion
export { ThermalExpansionLab, ThermalExpansionProps };