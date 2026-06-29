import { ReactNode } from "react";
import { RateOrder } from "@classytic/stage/chem";

//#region src/chem/kinetics/preset.d.ts
interface KineticsProps {
  /** Activation energy, kJ/mol (default 50). */
  EaKJ?: number;
  /** Rate constant at 300 K that sets the conversion pace (default 0.6). */
  kRef?: number;
  /** Reaction order for the half-life readout (default 1). */
  order?: RateOrder;
  /** Number of molecules in the vessel (default 30). */
  molecules?: number;
  /** Initial temperature, K (default 300). */
  T0?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function KineticsLab({
  EaKJ,
  kRef,
  order,
  molecules,
  T0,
  title,
  prompt,
  objectives
}?: KineticsProps): ReactNode;
//#endregion
export { KineticsLab, KineticsProps };