import { ReactNode } from "react";

//#region src/biology/enzyme-rate/preset.d.ts
interface EnzymeRateProps {
  factor?: 'temperature' | 'pH';
  optimum?: number;
  factorMin?: number;
  factorMax?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function EnzymeRateLab({
  factor,
  optimum,
  factorMin,
  factorMax,
  title,
  prompt,
  height,
  objectives
}: EnzymeRateProps): ReactNode;
//#endregion
export { EnzymeRateLab, EnzymeRateProps };