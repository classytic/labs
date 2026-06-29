import { ReactNode } from "react";
import { StoichSpecies } from "@classytic/stage/chem";

//#region src/chem/stoichiometry/preset.d.ts
interface Spec extends StoichSpecies {
  color: string;
}
interface StoichiometryProps {
  reaction?: 'water' | 'ammonia' | 'methane' | 'rust';
  /** Override the reactant amounts (mol). */
  amounts?: number[];
  /** Author a custom reaction (overrides the preset). */
  reactants?: Spec[];
  products?: Spec[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function StoichiometryLab({
  reaction,
  amounts: amounts0,
  reactants: customR,
  products: customP,
  title,
  prompt,
  objectives
}?: StoichiometryProps): ReactNode;
//#endregion
export { StoichiometryLab, StoichiometryProps };