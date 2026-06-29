import { ReactNode } from "react";

//#region src/biology/punnett-cross/preset.d.ts
interface PunnettCrossProps {
  parent1?: string;
  parent2?: string;
  dominantLabel?: string;
  recessiveLabel?: string;
  alleleLetter?: string;
  predictFirst?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function PunnettCrossLab({
  parent1,
  parent2,
  dominantLabel,
  recessiveLabel,
  alleleLetter,
  predictFirst,
  title,
  prompt,
  objectives
}: PunnettCrossProps): ReactNode;
//#endregion
export { PunnettCrossLab, PunnettCrossProps };