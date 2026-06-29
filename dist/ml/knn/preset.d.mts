import { ReactNode } from "react";

//#region src/ml/knn/preset.d.ts
type KnnDataset = 'blobs' | 'xor' | 'circles';
interface KnnProps {
  dataset?: KnnDataset;
  k?: number;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function KNNBoundaryLab({
  dataset,
  k,
  seed,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: KnnProps): ReactNode;
//#endregion
export { KNNBoundaryLab, KnnDataset, KnnProps };