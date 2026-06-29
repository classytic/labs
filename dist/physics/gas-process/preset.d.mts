import { ReactNode } from "react";
import { ProcessKind } from "@classytic/stage/thermo";

//#region src/physics/gas-process/preset.d.ts
interface GasProcessProps {
  kind?: ProcessKind;
  /** Default gas (learner can still toggle). */
  gas?: 'monatomic' | 'diatomic';
  /** Initial amount, mol (default 1). */
  moles?: number;
  /** Initial temperature, K (default 300). */
  tempK?: number;
  /** Initial volume, L (default 20). */
  volumeL?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function GasProcessLab({
  kind: kind0,
  title,
  prompt,
  objectives,
  gas: gas0,
  moles,
  tempK,
  volumeL
}?: GasProcessProps): ReactNode;
//#endregion
export { GasProcessLab, GasProcessProps };