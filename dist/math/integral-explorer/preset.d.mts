import { ReactNode } from "react";

//#region src/math/integral-explorer/preset.d.ts
interface IntegralExplorerProps {
  equation?: string;
  xRange?: [number, number];
  a?: number;
  b?: number;
  n?: number;
  title?: string;
  height?: number;
}
declare function IntegralExplorer({
  equation,
  xRange,
  a: aInit,
  b: bInit,
  n: nInit,
  title,
  height
}?: IntegralExplorerProps): ReactNode;
//#endregion
export { IntegralExplorer, IntegralExplorerProps };