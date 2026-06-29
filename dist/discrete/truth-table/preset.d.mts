import { ReactNode } from "react";

//#region src/discrete/truth-table/preset.d.ts
type TruthTableMode = 'show' | 'fill' | 'classify';
interface TruthTableProps {
  formula: string;
  /** Optional second formula → side-by-side columns + an equivalence verdict. */
  compare?: string;
  mode?: TruthTableMode;
  /** Show the built-up sub-expression columns (show mode). Default true. */
  breakdown?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}
declare function TruthTableLab({
  formula,
  compare,
  mode: mode0,
  breakdown,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId
}: TruthTableProps): ReactNode;
//#endregion
export { TruthTableLab, TruthTableMode, TruthTableProps };