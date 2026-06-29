import { ReactNode } from "react";

//#region src/ml/kmeans/preset.d.ts
interface KMeansProps {
  points?: {
    x: number;
    y: number;
  }[];
  k?: number;
  seeds?: {
    x: number;
    y: number;
  }[];
  span?: number;
  showLines?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}
declare function KMeansLab({
  points,
  k,
  seeds,
  span,
  showLines,
  title,
  prompt,
  objectives,
  height
}: KMeansProps): ReactNode;
//#endregion
export { KMeansLab, KMeansProps };