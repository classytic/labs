import { ReactNode } from "react";

//#region src/chem/diffusion/preset.d.ts
interface DiffusionProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function DiffusionLab({
  title,
  prompt,
  objectives
}?: DiffusionProps): ReactNode;
//#endregion
export { DiffusionLab, DiffusionProps };