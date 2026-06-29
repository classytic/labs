import { ReactNode } from "react";

//#region src/chem/battery.d.ts
interface BatteryProps {
  /** Cell EMF in volts (Zn–Cu Daniell ≈ 1.10). */
  emf?: number | string;
  title?: string;
  height?: number;
}
declare function Battery({
  emf,
  title,
  height
}?: BatteryProps): ReactNode;
//#endregion
export { Battery, BatteryProps };