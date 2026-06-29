import { ReactNode } from "react";

//#region src/physics/entropy/preset.d.ts
type Mode = 'heat' | 'expansion';
interface EntropyProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function EntropyLab({
  mode: mode0,
  title,
  prompt,
  objectives
}?: EntropyProps): ReactNode;
//#endregion
export { EntropyLab, EntropyProps };