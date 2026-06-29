import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/math/straight-line/preset.d.ts
type StraightLineMode = 'two-point' | 'gradient-intercept' | 'intercept-form' | 'parallel' | 'perpendicular';
interface StraightLineProps {
  mode?: StraightLineMode;
  /** Starting draggable points (two-point / gradient-intercept / intercept-form). */
  pointA?: Vec2;
  pointB?: Vec2;
  /** The fixed line for parallel / perpendicular modes. */
  given?: {
    m: number;
    c: number;
  };
  /** Starting position of the draggable point P (parallel / perpendicular). */
  through?: Vec2;
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  height?: number;
  /** Drag snap step in units (0 = free). Default 1. */
  snap?: number;
  /** two-point: also show |AB| and the midpoint. */
  showDistance?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function StraightLineLab(props?: StraightLineProps): ReactNode;
//#endregion
export { StraightLineLab, StraightLineMode, StraightLineProps };