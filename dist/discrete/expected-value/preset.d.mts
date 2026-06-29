import { ReactNode } from "react";

//#region src/discrete/expected-value/preset.d.ts
interface EVOutcome {
  label?: string;
  value: number;
  prob: number;
}
interface ExpectedValueProps {
  outcomes?: EVOutcome[];
  cost?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function ExpectedValueLab({
  outcomes,
  cost,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: ExpectedValueProps): ReactNode;
//#endregion
export { EVOutcome, ExpectedValueLab, ExpectedValueProps };