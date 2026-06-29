import { SeqKind } from "../core/sequences.mjs";
import { ReactNode } from "react";

//#region src/statistics/sequence/preset.d.ts
interface SequenceProps {
  kind?: SeqKind;
  first?: number;
  step?: number;
  count?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function SequenceLab({
  kind,
  first,
  step,
  count,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: SequenceProps): ReactNode;
//#endregion
export { SequenceLab, SequenceProps };