import { ReactNode } from "react";

//#region src/physics/magnetism/preset.d.ts
interface MagnetismProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function MagnetismLab({
  title,
  prompt,
  objectives
}?: MagnetismProps): ReactNode;
//#endregion
export { MagnetismLab, MagnetismProps };