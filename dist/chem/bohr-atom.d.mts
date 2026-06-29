import { ReactNode } from "react";

//#region src/chem/bohr-atom.d.ts
interface BohrAtomProps {
  /** Atomic number Z (protons). 1–20. Default 6 (carbon). */
  protons?: number | string;
  title?: string;
  height?: number;
}
declare function BohrAtom({
  protons,
  title,
  height
}?: BohrAtomProps): ReactNode;
//#endregion
export { BohrAtom, BohrAtomProps };