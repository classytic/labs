import { ReactNode } from "react";

//#region src/ml/regression/preset.d.ts
interface RegressionProps {
  data?: {
    x: number;
    y: number;
  }[];
  showSquares?: boolean;
  learnRate?: number;
  m0?: number;
  b0?: number;
  span?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}
declare function RegressionLab({
  data,
  showSquares,
  learnRate,
  m0,
  b0,
  span,
  title,
  prompt,
  objectives,
  height
}: RegressionProps): ReactNode;
//#endregion
export { RegressionLab, RegressionProps };