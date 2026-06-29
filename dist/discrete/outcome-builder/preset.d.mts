import { ReactNode } from "react";

//#region src/discrete/outcome-builder/preset.d.ts
type StageKind = 'coin' | 'die';
interface OutcomeBuilderProps {
  stages?: StageKind[];
  maxOutcomes?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function OutcomeBuilderLab({
  stages: stages0,
  maxOutcomes,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: OutcomeBuilderProps): ReactNode;
//#endregion
export { OutcomeBuilderLab, OutcomeBuilderProps };