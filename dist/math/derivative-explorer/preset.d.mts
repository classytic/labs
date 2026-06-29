import { ReactNode } from "react";

//#region src/math/derivative-explorer/preset.d.ts
interface DerivativeExplorerProps {
  equation?: string;
  xRange?: [number, number];
  startX?: number;
  title?: string;
  height?: number;
}
declare function DerivativeExplorer({
  equation,
  xRange,
  startX,
  title,
  height
}?: DerivativeExplorerProps): ReactNode;
//#endregion
export { DerivativeExplorer, DerivativeExplorerProps };