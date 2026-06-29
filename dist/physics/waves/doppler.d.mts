import { ReactNode } from "react";

//#region src/physics/waves/doppler.d.ts
interface DopplerProps {
  mach?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function DopplerLab({
  mach,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: DopplerProps): ReactNode;
//#endregion
export { DopplerLab, DopplerProps };