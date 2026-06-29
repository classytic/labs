import { Curve } from "./core.mjs";
import { ReactNode } from "react";

//#region src/commerce/economics/demand-shift-vs-move.d.ts
interface Shifter {
  label: string;
  target: 'demand' | 'supply';
  delta: number;
}
interface DemandShiftVsMoveProps {
  demand?: Curve;
  supply?: Curve;
  shifters?: Shifter[];
  askPrediction?: boolean;
  priceMax?: number;
  qtyMax?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}
declare function DemandShiftVsMoveLab({
  demand,
  supply,
  shifters,
  askPrediction,
  priceMax,
  qtyMax,
  title,
  prompt,
  height,
  objectives
}: DemandShiftVsMoveProps): ReactNode;
//#endregion
export { DemandShiftVsMoveLab, DemandShiftVsMoveProps, Shifter };