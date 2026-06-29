import { ReactNode } from "react";

//#region src/kit/steps.d.ts
interface Steps {
  step: number;
  total: number;
  atStart: boolean;
  atEnd: boolean;
  next: () => void;
  prev: () => void;
  setStep: (n: number) => void;
}
declare function useSteps(total: number): Steps;
declare function StepNav({
  steps,
  nextLabel,
  doneLabel
}: {
  steps: Steps;
  nextLabel?: string;
  doneLabel?: string;
}): ReactNode;
//#endregion
export { StepNav, Steps, useSteps };