import { ReactNode } from "react";

//#region src/math/complex/preset.d.ts
type ComplexMode = 'point' | 'multiply' | 'power' | 'roots';
interface ComplexPlaneProps {
  start?: {
    re: number;
    im: number;
  };
  mode?: ComplexMode;
  /** roots mode: how many nth-roots of unity to draw (clamped 2..12). */
  rootsN?: number;
  /** power mode: highest power to plot (clamped 2..6). */
  powerN?: number;
  /** grid snap in units (0 = free). Default 1. */
  snap?: number;
  /** view half-extent ±range on both axes. Default 6. */
  range?: number;
  /** target z for a checkpoint ("drag to 3 + 4i"). */
  target?: {
    re: number;
    im: number;
  };
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function ComplexPlaneLab(props?: ComplexPlaneProps): ReactNode;
//#endregion
export { ComplexMode, ComplexPlaneLab, ComplexPlaneProps };