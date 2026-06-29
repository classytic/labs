import { ReactNode } from "react";

//#region src/discrete/monty-hall/preset.d.ts
interface MontyHallProps {
  doors?: number;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function MontyHallLab({
  doors,
  seed,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: MontyHallProps): ReactNode;
//#endregion
export { MontyHallLab, MontyHallProps };