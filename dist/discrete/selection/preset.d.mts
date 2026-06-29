import { ReactNode } from "react";

//#region src/discrete/selection/preset.d.ts
interface SelectionGroup {
  label: string;
  count: number;
  color?: string;
}
type SelectionMode = 'count' | 'probability';
interface SelectionProps {
  groups?: SelectionGroup[];
  draw?: number;
  want?: number[];
  mode?: SelectionMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function SelectionLab({
  groups,
  draw,
  want,
  mode: mode0,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: SelectionProps): ReactNode;
//#endregion
export { SelectionGroup, SelectionLab, SelectionMode, SelectionProps };