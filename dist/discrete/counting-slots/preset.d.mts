import { ReactNode } from "react";

//#region src/discrete/counting-slots/preset.d.ts
type SlotMode = 'arrange' | 'choose';
interface CountingSlotsProps {
  items?: string[];
  slots?: number;
  positions?: string[];
  mode?: SlotMode;
  replacement?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function CountingSlotsLab({
  items,
  slots,
  positions,
  mode: mode0,
  replacement: repl0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: CountingSlotsProps): ReactNode;
//#endregion
export { CountingSlotsLab, CountingSlotsProps, SlotMode };