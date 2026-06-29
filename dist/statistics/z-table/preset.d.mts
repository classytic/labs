import { ReactNode } from "react";

//#region src/statistics/z-table/preset.d.ts
type ZTail = 'left' | 'right';
interface ZTableProps {
  x?: number;
  mu?: number;
  sigma?: number;
  tail?: ZTail;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function ZTableLab({
  x,
  mu,
  sigma,
  tail,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: ZTableProps): ReactNode;
//#endregion
export { ZTableLab, ZTableProps, ZTail };