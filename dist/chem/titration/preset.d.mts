import { ReactNode } from "react";

//#region src/chem/titration/preset.d.ts
interface TitrationProps {
  analyte?: 'strong-acid' | 'weak-acid';
  /** Acid concentration in the flask, mol/L (default 0.1). */
  concAcid?: number;
  /** Acid volume in the flask, mL (default 25). */
  volAcidMl?: number;
  /** Strong-base titrant concentration, mol/L (default 0.1). */
  concBase?: number;
  /** Weak-acid pKa (default 4.76 = acetic acid). */
  pKa?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function TitrationLab({
  analyte: analyte0,
  concAcid,
  volAcidMl,
  concBase,
  pKa: pKa0,
  title,
  prompt,
  objectives
}?: TitrationProps): ReactNode;
//#endregion
export { TitrationLab, TitrationProps };