import { SequenceKind } from "./core.mjs";
import { ReactNode } from "react";

//#region src/biology/sequence/preset.d.ts
interface SequenceLabProps {
  kind?: SequenceKind;
  template?: string[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function SequenceLab({
  kind,
  template,
  title,
  prompt,
  objectives
}: SequenceLabProps): ReactNode;
//#endregion
export { SequenceLab, SequenceLabProps };