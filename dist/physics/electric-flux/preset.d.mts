import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/physics/electric-flux/preset.d.ts
interface ElectricFluxProps {
  /** Field strength in vacuum (arbitrary units). */
  field?: number;
  /** Area (length of the flat window, in scene units). */
  area?: number;
  /** Initial angle between the area's normal and the field, in degrees. */
  angleDeg?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}
declare function ElectricFluxLab({
  field,
  area,
  angleDeg,
  title,
  prompt,
  ask,
  height,
  activity
}?: ElectricFluxProps): ReactNode;
//#endregion
export { ElectricFluxLab, ElectricFluxProps };