import { ReactNode } from "react";

//#region src/biology/respiration/preset.d.ts
interface RespirationProps {
  mode?: 'day' | 'night';
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function RespirationLab({
  mode,
  title,
  prompt,
  objectives
}: RespirationProps): ReactNode;
//#endregion
export { RespirationLab, RespirationProps };