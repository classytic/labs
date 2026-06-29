import { ReactNode } from "react";

//#region src/physics/electric-field/preset.d.ts
interface ElectricFieldProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function ElectricFieldLab({
  title,
  prompt,
  objectives
}?: ElectricFieldProps): ReactNode;
//#endregion
export { ElectricFieldLab, ElectricFieldProps };