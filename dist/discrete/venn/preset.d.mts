import { Elem } from "../core/sets.mjs";
import { ReactNode } from "react";

//#region src/discrete/venn/preset.d.ts
interface VennSet {
  name: string;
  members: Elem[];
}
type VennMode = 'explore' | 'shade';
interface VennSetBoardProps {
  sets: VennSet[];
  mode?: VennMode;
  /** shade mode: the target set expression over the set NAMES (∩ ∪ ¬, or ∧ ∨ !). */
  target?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function VennSetBoardLab({
  sets,
  mode: mode0,
  target,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: VennSetBoardProps): ReactNode;
//#endregion
export { VennMode, VennSet, VennSetBoardLab, VennSetBoardProps };