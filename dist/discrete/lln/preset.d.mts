import { ReactNode } from "react";

//#region src/discrete/lln/preset.d.ts
interface LlnProps {
  experiment?: 'coin' | 'die';
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function LawOfLargeNumbersLab({
  experiment: exp0,
  title,
  prompt,
  objectives
}?: LlnProps): ReactNode;
//#endregion
export { LawOfLargeNumbersLab, LlnProps };