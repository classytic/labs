import { CrossModelSpec } from "./core.mjs";
import { ReactNode } from "react";

//#region src/biology/genetic-cross/preset.d.ts
interface GeneticCrossProps {
  spec?: CrossModelSpec;
  loci?: CrossModelSpec[];
  parent1?: string[] | string[][];
  parent2?: string[] | string[][];
  predictFirst?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function GeneticCrossLab({
  spec,
  loci,
  parent1,
  parent2,
  predictFirst,
  title,
  prompt,
  objectives
}: GeneticCrossProps): ReactNode;
//#endregion
export { GeneticCrossLab, GeneticCrossProps };