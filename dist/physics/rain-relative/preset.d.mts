import { ReactNode } from "react";

//#region src/physics/rain-relative/preset.d.ts
interface RainRelativeProps {
  maxSpeed?: number;
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
}
declare function RainRelativeLab({
  maxSpeed,
  start,
  title,
  prompt,
  height
}: RainRelativeProps): ReactNode;
//#endregion
export { RainRelativeLab, RainRelativeProps };