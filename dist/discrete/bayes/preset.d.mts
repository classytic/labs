import { ReactNode } from "react";

//#region src/discrete/bayes/preset.d.ts
interface BayesProps {
  prior?: number;
  sensitivity?: number;
  falsePositive?: number;
  population?: number;
  conditionLabels?: [string, string];
  testLabels?: [string, string];
  predict?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function BayesLab({
  prior,
  sensitivity,
  falsePositive,
  population,
  conditionLabels,
  testLabels,
  predict,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: BayesProps): ReactNode;
//#endregion
export { BayesLab, BayesProps };