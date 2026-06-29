import { ReactNode } from "react";

//#region src/discrete/counting-tree/preset.d.ts
interface TreeBranch {
  label: string;
  weight?: number;
}
interface TreeStage {
  label?: string;
  branches: TreeBranch[];
}
type CountAsk = 'ordered' | 'unordered';
interface CountingTreeProps {
  stages?: TreeStage[];
  /** Draw-from-a-pool form (generates the stages). */
  pool?: string[];
  draws?: number;
  replacement?: boolean;
  mode?: 'count' | 'probability';
  /** count mode: ask for the ordered total, or the unordered (÷k!) count. */
  ask?: CountAsk;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function CountingTreeLab({
  stages,
  pool,
  draws,
  replacement,
  mode,
  ask,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: CountingTreeProps): ReactNode;
//#endregion
export { CountAsk, CountingTreeLab, CountingTreeProps, TreeBranch, TreeStage };