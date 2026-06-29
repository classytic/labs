import { ReactNode } from "react";

//#region src/physics/temperature-scales/preset.d.ts
interface TemperatureScalesProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function TemperatureScalesLab({
  title,
  prompt,
  objectives
}?: TemperatureScalesProps): ReactNode;
//#endregion
export { TemperatureScalesLab, TemperatureScalesProps };