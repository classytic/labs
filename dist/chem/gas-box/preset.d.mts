import { ReactNode } from "react";

//#region src/chem/gas-box/preset.d.ts
interface GasBoxProps {
  holdConstant?: 'none' | 'temperature' | 'volume' | 'pressure';
  particleCount?: number;
  temperature?: number;
  volume?: number;
  showGauge?: boolean;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function GasBoxLab({
  holdConstant,
  particleCount,
  temperature,
  volume,
  showGauge,
  title,
  prompt,
  height,
  objectives
}: GasBoxProps): ReactNode;
//#endregion
export { GasBoxLab, GasBoxProps };