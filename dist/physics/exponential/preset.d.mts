import { ReactNode } from "react";

//#region src/physics/exponential/preset.d.ts
interface DecayCoolingProps {
  mode?: 'decay' | 'cooling';
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function DecayCoolingLab({
  mode: mode0,
  title,
  prompt,
  objectives
}?: DecayCoolingProps): ReactNode;
//#endregion
export { DecayCoolingLab, DecayCoolingProps };