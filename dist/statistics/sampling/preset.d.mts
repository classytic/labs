import { ReactNode } from "react";

//#region src/statistics/sampling/preset.d.ts
type SamplingMode = 'sampling' | 'ci';
interface SamplingProps {
  mu?: number;
  sigma?: number;
  n?: number;
  confidence?: 0.8 | 0.9 | 0.95 | 0.99;
  mode?: SamplingMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function SamplingDistributionLab({
  mu,
  sigma,
  n,
  confidence,
  mode: mode0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: SamplingProps): ReactNode;
//#endregion
export { SamplingDistributionLab, SamplingMode, SamplingProps };