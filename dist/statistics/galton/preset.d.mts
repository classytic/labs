import { ReactNode } from "react";

//#region src/statistics/galton/preset.d.ts
interface GaltonBoardProps {
  rows?: number;
  seed?: number;
  showCurve?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function GaltonBoardLab({
  rows,
  seed,
  showCurve,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: GaltonBoardProps): ReactNode;
//#endregion
export { GaltonBoardLab, GaltonBoardProps };