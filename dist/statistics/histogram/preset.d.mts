import { ReactNode } from "react";

//#region src/statistics/histogram/preset.d.ts
interface HistogramBoxProps {
  data?: number[];
  bins?: number;
  min?: number;
  max?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function HistogramBoxLab({
  data,
  bins,
  min,
  max,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: HistogramBoxProps): ReactNode;
//#endregion
export { HistogramBoxLab, HistogramBoxProps };