import { ReactNode } from "react";

//#region src/chem/solution/dilution.d.ts
interface DilutionProps {
  stockConcentration?: number;
  aliquotVolume?: number;
  finalVolume?: number;
  maxMolarity?: number;
  hue?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function DilutionLab({
  stockConcentration,
  aliquotVolume,
  finalVolume,
  maxMolarity,
  hue,
  title,
  prompt,
  height,
  objectives
}: DilutionProps): ReactNode;
//#endregion
export { DilutionLab, DilutionProps };