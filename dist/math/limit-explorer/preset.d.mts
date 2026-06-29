import { ReactNode } from "react";

//#region src/math/limit-explorer/preset.d.ts
interface LimitExplorerProps {
  equation?: string;
  xRange?: [number, number];
  c?: number;
  title?: string;
  height?: number;
}
declare function LimitExplorer({
  equation,
  xRange,
  c: cInit,
  title,
  height
}?: LimitExplorerProps): ReactNode;
//#endregion
export { LimitExplorer, LimitExplorerProps };