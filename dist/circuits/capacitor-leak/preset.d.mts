import { ReactNode } from "react";

//#region src/circuits/capacitor-leak/preset.d.ts
interface CapacitorLeakProps {
  /** Source EMF in volts. */
  emf?: number;
  /** Charging resistance in kΩ. */
  rK?: number;
  /** Capacitance in µF. */
  capU?: number;
  /** Leakage resistance in kΩ (larger ⇒ slower self-discharge). */
  leakK?: number;
  /** Start with the capacitor already full. */
  startCharged?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}
declare function CapacitorLeakLab({
  emf,
  rK,
  capU,
  leakK,
  startCharged,
  title,
  prompt,
  objectives,
  hints
}: CapacitorLeakProps): ReactNode;
//#endregion
export { CapacitorLeakLab, CapacitorLeakProps };