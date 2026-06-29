import { ReactNode } from "react";

//#region src/ml/boundary/preset.d.ts
type BoundaryDataset = 'separable' | 'overlap' | 'xor';
interface BoundaryProps {
  dataset?: BoundaryDataset;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function DecisionBoundaryLab({
  dataset,
  seed,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: BoundaryProps): ReactNode;
//#endregion
export { BoundaryDataset, BoundaryProps, DecisionBoundaryLab };