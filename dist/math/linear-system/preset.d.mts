import { ReactNode } from "react";

//#region src/math/linear-system/preset.d.ts
interface SystemLine {
  m: number;
  b: number;
  label?: string;
  color?: string;
}
interface LinearSystemProps {
  /** Two lines y = m·x + b. They must not be parallel. */
  lines?: [SystemLine, SystemLine];
  xRange?: [number, number];
  yRange?: [number, number];
  title?: string;
  prompt?: string;
  height?: number;
}
declare function LinearSystemLab({
  lines,
  xRange,
  yRange,
  title,
  prompt,
  height
}?: LinearSystemProps): ReactNode;
//#endregion
export { LinearSystemLab, LinearSystemProps, SystemLine };