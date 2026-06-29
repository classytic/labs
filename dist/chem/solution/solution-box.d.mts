import { ReactNode } from "react";

//#region src/chem/solution/solution-box.d.ts
interface SolutionBoxProps {
  moles?: number;
  volume?: number;
  /** Tint scaling: the molarity that reads as fully saturated colour. */
  maxMolarity?: number;
  hue?: number;
  showProbe?: boolean;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function SolutionBoxLab({
  moles,
  volume,
  maxMolarity,
  hue,
  showProbe,
  title,
  prompt,
  height,
  objectives
}: SolutionBoxProps): ReactNode;
//#endregion
export { SolutionBoxLab, SolutionBoxProps };