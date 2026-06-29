import { ReactNode } from "react";

//#region src/discrete/arrangements/preset.d.ts
interface ArrangeItem {
  label: string;
  count: number;
  color?: string;
}
interface ArrangementsProps {
  word?: string;
  items?: ArrangeItem[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function ArrangementsLab({
  word,
  items,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: ArrangementsProps): ReactNode;
//#endregion
export { ArrangeItem, ArrangementsLab, ArrangementsProps };