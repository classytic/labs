import { ReactNode } from "react";

//#region src/physics/work-energy/preset.d.ts
interface WorkEnergyProps {
  mode?: 'spring' | 'constant';
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function WorkEnergyLab({
  mode: mode0,
  title,
  prompt,
  objectives
}?: WorkEnergyProps): ReactNode;
//#endregion
export { WorkEnergyLab, WorkEnergyProps };