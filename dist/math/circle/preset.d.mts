import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/math/circle/preset.d.ts
interface CircleProps {
  center?: Vec2;
  radius?: number;
  /** Show a point on the rim with its tangent (⊥ to the radius). */
  showTangent?: boolean;
  /** Initial tangent-point position, degrees round the circle. */
  tangentAngleDeg?: number;
  /** Also show the expanded x² + y² + Dx + Ey + F = 0 form. */
  showExpanded?: boolean;
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  height?: number;
  /** Drag snap step (0 = free). Default 1. */
  snap?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function CircleLab({
  center: center0,
  radius,
  showTangent,
  tangentAngleDeg,
  showExpanded,
  view,
  height,
  snap,
  title,
  prompt,
  ask,
  activity
}?: CircleProps): ReactNode;
//#endregion
export { CircleLab, CircleProps };