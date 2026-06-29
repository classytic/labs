import { ReactNode } from "react";

//#region src/biology/photosynthesis-factors/preset.d.ts
interface PhotosynthesisFactorsProps {
  light?: number;
  co2?: number;
  temperature?: number;
  tempOptimum?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function PhotosynthesisFactorsLab({
  light,
  co2,
  temperature,
  tempOptimum,
  title,
  prompt,
  height,
  objectives
}: PhotosynthesisFactorsProps): ReactNode;
//#endregion
export { PhotosynthesisFactorsLab, PhotosynthesisFactorsProps };