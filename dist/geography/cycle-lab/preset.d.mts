import { CycleEdge, CycleNode } from "../../kit/cycle.mjs";
import { ReactNode } from "react";

//#region src/geography/cycle-lab/preset.d.ts
type CycleChallenge = 'trace' | 'label-process';
interface CycleLabProps {
  nodes?: CycleNode[];
  edges?: CycleEdge[];
  challenge?: CycleChallenge;
  size?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function CycleLab({
  nodes,
  edges,
  challenge,
  size,
  title,
  prompt,
  objectives
}: CycleLabProps): ReactNode;
//#endregion
export { CycleChallenge, CycleLab, CycleLabProps };