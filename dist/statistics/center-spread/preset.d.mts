import { ReactNode } from "react";

//#region src/statistics/center-spread/preset.d.ts
interface CenterSpreadProps {
  data?: number[];
  min?: number;
  max?: number;
  step?: number;
  showSigma?: boolean;
  challenge?: {
    stat: 'mean' | 'median';
    target: number;
  };
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function CenterSpreadLab({
  data,
  min,
  max,
  step,
  showSigma,
  challenge,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: CenterSpreadProps): ReactNode;
//#endregion
export { CenterSpreadLab, CenterSpreadProps };