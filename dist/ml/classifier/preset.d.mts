import { ReactNode } from "react";

//#region src/ml/classifier/preset.d.ts
interface ClassifierProps {
  positives?: number[];
  negatives?: number[];
  threshold?: number;
  span?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}
declare function ClassifierThresholdLab({
  positives,
  negatives,
  threshold,
  span,
  title,
  prompt,
  objectives,
  height
}: ClassifierProps): ReactNode;
//#endregion
export { ClassifierProps, ClassifierThresholdLab };