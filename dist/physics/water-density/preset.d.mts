import { ReactNode } from "react";

//#region src/physics/water-density/preset.d.ts
type Mode = 'anomaly' | 'lake';
interface WaterDensityProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function WaterDensityLab({
  mode: mode0,
  title,
  prompt,
  objectives
}?: WaterDensityProps): ReactNode;
//#endregion
export { WaterDensityLab, WaterDensityProps };