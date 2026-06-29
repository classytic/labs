import { ReactNode } from "react";

//#region src/chem/electrochem/preset.d.ts
interface ElectrochemProps {
  metalA?: string;
  metalB?: string;
  concA?: number;
  concB?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function ElectrochemLab({
  metalA,
  metalB,
  concA,
  concB,
  title,
  prompt,
  objectives
}?: ElectrochemProps): ReactNode;
//#endregion
export { ElectrochemLab, ElectrochemProps };